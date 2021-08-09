/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env worker, serviceworker */

import {
    CONFIGURE_THROTTLING,
    CONFIGURED_THROTTLING,
    HIGH,
    NETWORK_BUSY_STATUS,
    NORMAL,
    LOW,
    UNTHROTTLED,
    X_PWA_PRIORITY,
    downloadCompleteEvent,
    downloadStartedEvent,
    downloadThrottledEvent
} from '../utils/download-shared'

/**
 * The DownloadTracker tracks downloads in progress and can throttle
 * them.
 */

/**
 * The current number of downloads in progress.
 * @type {number}
 */
let downloadsInProgress = 0

/**
 * The currently configured maximum number of downloads that should be
 * in progress. If this is falsy (0), then any number of downloads is
 * allowed.
 * @type {number}
 */
const DEFAULT_MAX_DOWNLOADS = 2
let maxDownloads = DEFAULT_MAX_DOWNLOADS // any falsy value means unlimited

/**
 * The set of priority filters applied to URLs that are fetched. See
 * the DownloadManager code for details.
 * @type {{regexp: string, priority: string}[]}
 */
let priorityFilters = []

/**
 * Map from priority name ('high', 'normal', 'low') to an array of pending
 * fetches with that priority.
 */
const pendingFetches = {
    [HIGH]: [],
    [NORMAL]: [],
    [LOW]: []
}

/**
 * Enumeration of supported service-worker libraries.
 */
export const COMPATIBILITY_MODES = {
    SWTOOLBOX: 'sw-toolbox',
    WORKBOX: 'workbox'
}

/**
 * Test if the given priority string is valid
 * @param priority {string}
 * @returns {boolean}
 */
const isValidPriority = (priority) => priority in pendingFetches || priority === UNTHROTTLED

/**
 * Default priorities set by request destination. These are applied
 * if no priorityFilters object matches a request's URL.
 * See https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent and
 * https://developer.mozilla.org/en-US/docs/Web/API/Request for details
 * of Request.destination and the string values that it may have.
 */
const destinationPriorities = {
    script: HIGH,
    image: LOW,
    unknown: LOW,

    // Any style-related fetch will always be unthrottled.
    style: UNTHROTTLED
}

/**
 * Delay between a change in the network state and posting of an update
 * message to clients, with the new state.
 */
const UPDATE_CLIENT_DELAY_MS = 50

/**
 * A resolved promise that gets reused to avoid constructing a new one
 * every time.
 */
const resolvedPromise = Promise.resolve()

/**
 * Whether debug logging is enabled. This is set in the configuration
 * message from the DownloadManager.
 * @type {boolean}
 */
let debug = false

const logPrefix = ['[DownloadTracker]']

const debugLog = (...args) => {
    /* istanbul ignore next */
    if (debug) {
        console.log(...logPrefix.concat(args))
    }
}

/**
 * Reference to the toolbox router used by the worker - set in
 * startDownloadTracker and used in the fetchEventHandler
 * @type {null}
 */
let router = null

/**
 * Global event handler. It will be initialized (in `fetchEventHandler`) as a
 * request handling function just in case the startDownloadTracker function is
 * never called (i.e. maybe the `worker` function is imported but not used).
 * This value is changed based on the `mode` set at start up.
 */
let handleEvent

/**
 * The service-worker library compatibility mode. By default its set to
 * to `sw-toolbox` compatibility.
 */
let mode

/**
 * An array of reply ports for clients that have sent us a recognized
 * message, to which we will post network status updates. See
 * replyToMessageEvent. In practice, there will nearly always be one
 * client, but it's possible for a service worker to have multiple
 * clients, so we have to handle that case.
 */
let clientPorts = []

/**
 * Return the current tracker state. Exported ONLY for testing.
 * @returns {{}}
 */
export const getStateForTests = () => ({
    clientPorts,
    debug,
    downloadsInProgress,
    handleEvent,
    maxDownloads,
    mode,
    pendingFetches,
    priorityFilters
})

/**
 * Exported ONLY for testing
 */
export const setDownloadsInProgress = (value) => (downloadsInProgress = value)

/**
 * Reply to the given MessageEvent with the given message object.
 * Also ensures that the reply message port used is added to
 * clientPorts so that it will be sent update messages.
 */
const replyToMessageEvent = (event, message) => {
    /* istanbul ignore else */
    if (event.ports && event.ports.length) {
        const port = event.ports[0]
        debugLog(`Sending response ${JSON.stringify(message)}`)

        port.postMessage(message)

        // If the port is not already in clientPorts, add it. We can't use
        // port objects as keys in an object, so we have to scan the array.
        // In nearly all cases, there will be one port in the list.
        /* istanbul ignore next */
        if (!clientPorts.find((el) => el === port)) {
            clientPorts.push(port)
        }
    }
}

/**
 * Post the given message to all the clientPorts. If posting fails,
 * remove the port from clientPorts (in practice, posting never
 * actually fails, even if the client is closed).
 */
const postToClients = (message) => {
    clientPorts = clientPorts.filter((port) => {
        try {
            port.postMessage(message)
            return true
        } catch (e) {
            /* istanbul ignore next */
            return false
        }
    })
}

const stopMessageEvent = (event) => {
    /* istanbul ignore else */
    if (event.stopImmediatePropagation) {
        event.stopImmediatePropagation()
    }

    /* istanbul ignore next */
    if (event.respondWith) {
        event.respondWith(Promise.resolve())
    }
}

/**
 * setTimeout handle for a pending call to _updateClients
 */
let clientUpdateHandle

/**
 * The previous network state posted to clients in _updateClients.
 * We don't send an update if the state doesn't change.
 */
let previousNetworkState

/**
 * Timeout handler that sends an update of the network state to
 * clients.
 * @private
 */
const _updateClients = () => {
    clientUpdateHandle = null
    const networkBusy = !!downloadsInProgress
    debugLog(`downloadsInProgress=${downloadsInProgress}, networkBusy=${networkBusy}`)
    /* istanbul ignore else */
    if (networkBusy !== previousNetworkState) {
        previousNetworkState = networkBusy
        debugLog(`Posting networkBusy=${networkBusy} update to clients`)
        postToClients({
            command: NETWORK_BUSY_STATUS,
            // networkBusy is true if anything is happening on the
            // network, and false if there are no downloads.
            networkBusy
        })
    }
}

/**
 * This is the default event handler that fetches using the event's request.
 * @private
 */
const _fetchRequest = (event) => fetch(event.request)

/**
 * Update any clients with the current network state.
 * This can be called at any point, and will queue an update
 * that will happen shortly. This allows us to avoid posting
 * many updates if the network state changes rapidly (as it
 * will do if there are many fetches for resources that are
 * cached).
 */
const updateClients = () => {
    if (!clientUpdateHandle) {
        clientUpdateHandle = self.setTimeout(_updateClients, UPDATE_CLIENT_DELAY_MS)
    }
}

/**
 * Calculate how many free network slots there are, and start up to that
 * many pending fetches.
 * On entry to this function, downloadsInProgress must be up to date.
 */
const releasePendingFetches = () => {
    // Set 'unlimited' true if we're not throttling
    const unlimited = !maxDownloads

    // Start up to 'available' pending fetches, or if 'unlimited' is true,
    // start all pending fetches. Start them in priority order.
    for (
        let available = Math.max(0, maxDownloads - downloadsInProgress);
        unlimited || available; // eslint-disable-line no-unmodified-loop-condition
        available--
    ) {
        // Take from the queues in priority order
        const nextFetch =
            pendingFetches.high.shift() ||
            pendingFetches.normal.shift() ||
            pendingFetches.low.shift()

        // If there's no pending request to start, we're done
        if (!nextFetch) {
            break
        }

        /* istanbul ignore if */
        if (debug) {
            const elapsed = Date.now() - nextFetch.deferTime
            debugLog(
                `[Starting fetch for ${nextFetch.priority} priority request ${nextFetch.request.url}, delayed ${elapsed} mS`
            )
        }

        // Resolve the promise for this fetch, so that it will start.
        nextFetch.resolve()
    }

    // Since the network state may now have changed, update clients.
    updateClients()
}

/**
 * ExtendableEvent construction helper. Exported for testing.
 * @param type {string} - event type
 * @param data {object} - event values
 * @returns {ExtendableEvent}
 */
export const makeEvent = (type, data) => {
    const event = new ExtendableEvent(type)
    /* istanbul ignore next */
    Object.assign(event, data || {})
    return event
}

/**
 * The FetchEvent handler for the DownloadTracker must be the first handler
 * registered in the worker, so that it in control of all fetches made
 * by the clients. The sw-toolbox FetchEvent handler will always swallow
 * all events (i.e., it always calls event.respondWith), so no FetchEvents
 * are ever passed to any handler registered after it.
 *
 * This function will look up the sw-toolbox handler for a given URL,
 * and invoke it directly, so that it 'wraps' the sw-toolbox functionality.
 *
 * This handler is exported for testing
 *
 * @param event {FetchEvent}
 */
export const fetchEventHandler = (event) => {
    if (!handleEvent) {
        handleEvent = _fetchRequest
    }

    const request = event.request
    debugLog(`Fetch for ${request.url} (destination ${request.destination})`)

    const url = request.url

    // Default to normal priority, unless we can set by destination.
    let priority = destinationPriorities[request.destination] || NORMAL

    // If we find a filter match, override that default
    for (const filter of priorityFilters) {
        /* istanbul ignore else */
        if (filter.regexp.test(url)) {
            priority = filter.priority
            debugLog(`Filter sets priority for request to ${priority}`)
            break
        }
    }

    // And finally let any request header override the priority
    const headerPriority = request.headers.get(X_PWA_PRIORITY)
    if (isValidPriority(headerPriority)) {
        priority = headerPriority
    }

    // A function that will send a completion event for this request.
    const sendComplete = () => {
        self.dispatchEvent(makeEvent(downloadCompleteEvent, {request, url}))
    }

    // Do we want to throttle this fetch or allow it to continue?
    const allowFetch =
        // If maxDownloads is zero, we allow all fetches
        !maxDownloads ||
        // If the priority is UNTHROTTLED, we allow this fetch
        priority === UNTHROTTLED ||
        // If we're not at the maximum number of download, we allow this fetch
        downloadsInProgress < maxDownloads

    /* istanbul ignore if */
    if (debug) {
        debugLog(
            `${allowFetch ? 'Allowing' : 'Delaying'} fetch for ${priority} priority request ${url}`
        )
    }

    // If we don't throttle, we use a Promise that's already resolved.
    // If we do throttle, we create a Promise whose resolve function gets
    // pushed onto the pendingFetches Array corresponding to the request's
    // priority.
    const throttlePromise = allowFetch
        ? resolvedPromise
        : new Promise((resolve) => {
              pendingFetches[priority].push({
                  priority,
                  request,
                  deferTime: Date.now(),
                  resolve
              })
              self.dispatchEvent(makeEvent(downloadThrottledEvent, {request, url}))
          })

    // Finally, we respond to the event with the promise, chaining our own
    // then/catch handlers so that we continue to track downloads.
    event.respondWith(
        throttlePromise
            // If this fetch is throttled, this 'then' handler is called
            // when the fetch is eventually allowed to proceed. If the fetch
            // is not throttled, this is called immediately.
            .then(() => {
                // We track the download at the point that we
                // call the handler, since it may initiate
                // an actual network download. We can't tell if
                // it actually does that, or if it satisfies the
                // request from the cache, so we must consider that
                // there's an download in progress when we call it.
                downloadsInProgress += 1
                debugLog(`downloadsInProgress is ${downloadsInProgress}`)
                updateClients()
                self.dispatchEvent(makeEvent(downloadStartedEvent, {request, url}))
                return handleEvent(event)
            })
            // We must dispatch the completion event whether the request succeeds
            // or not.
            .then((response) => {
                sendComplete()
                return response
            })
            .catch((err) => {
                sendComplete()
                throw err
            })
    )
}

/**
 * Handle messages sent to this worker from the DownloadManager.
 *
 * Exported for testing
 *
 * @param event
 */
export const messageEventHandler = (event) => {
    const data = event.data
    /* istanbul ignore else */
    if (data && data.command === CONFIGURE_THROTTLING) {
        // Set the debug flag first, so that logging is enabled if it's set
        debug = !!data.debug

        debugLog(`${data.command} message: ${JSON.stringify(data)}`)
        maxDownloads = Math.max(0, data.maxDownloads || 0)
        const throttling = !!maxDownloads
        debugLog(
            `Throttling is now ${
                throttling ? 'enabled' : 'disabled'
            }, maxDownloads is ${maxDownloads}`
        ) // eslint-disable-line quotes

        const filters = data.priorityFilters
        if (filters && filters.length) {
            // Discard any filters that don't have a string regexp and
            // a valid priority, then store the filters with compiled
            // regexp objects.
            priorityFilters = filters
                .filter(
                    (filter) =>
                        typeof filter.regexp === 'string' && isValidPriority(filter.priority)
                )
                .map((filter) => ({
                    regexp: new RegExp(filter.regexp),
                    priority: filter.priority
                }))

            debugLog(`Added ${priorityFilters.length} priority filter(s)`)
        } else {
            debugLog(`Added no priority filters`)
            priorityFilters = []
        }

        // Send a reply to the message, containing the state of the tracker,
        // plus a 'throttling' boolean.
        replyToMessageEvent(event, {
            command: CONFIGURED_THROTTLING,
            throttling,
            maxDownloads,
            priorityFilters
        })

        // Prevent the event propagating further. This doesn't always
        // work.
        stopMessageEvent(event)

        // Because we may now be configured to allow more downloads
        // than are in progress, we should attempt to start any pending
        // fetches.
        releasePendingFetches()
    }
}

/**
 * Handle the internal downloadCompleteEvent, which is dispatched when
 * a fetch completes.
 *
 * Exported for testing
 *
 */
export const downloadCompleteEventHandler = (event) => {
    debugLog(`Download of ${event.url} complete`)

    // Count this download as done
    /* istanbul ignore next */
    if (downloadsInProgress > 0) {
        downloadsInProgress -= 1
    }
    debugLog(`downloadsInProgress is ${downloadsInProgress}`)

    releasePendingFetches()
}

self.addEventListener('fetch', fetchEventHandler)
self.addEventListener('message', messageEventHandler)
self.addEventListener(downloadCompleteEvent, downloadCompleteEventHandler)

/**
 * Given a 'mode' string, determine if it is compatible with the download-tracker
 * module based on the compatibilityModes object.
 *
 * @param mode
 */
const isModeCompatible = (mode) =>
    Object.keys(COMPATIBILITY_MODES)
        .map((key) => COMPATIBILITY_MODES[key])
        .indexOf(mode) > -1

/**
 * Given a 'mode' string, return the request handler.
 *
 * @param mode
 */
export const getEventHandler = (mode) => {
    let handler

    // Error out if the mode is defined but not compatible
    const modeIsCompatible = isModeCompatible(mode)

    if (!modeIsCompatible) {
        throw new Error('Service worker compatibility mode is not supported.')
    }

    // Set the global request handler
    switch (mode) {
        case COMPATIBILITY_MODES.WORKBOX:
            handler = (event) => {
                const handler = router.handleRequest.bind(router)
                return handler(event) || fetch(event.request)
            }
            break
        case COMPATIBILITY_MODES.SWTOOLBOX:
            handler = ({request}) => {
                const handler = (router && router.match(request)) || fetch
                return handler(request)
            }
            break
        default:
            handler = _fetchRequest
            break
    }

    return handler
}

/**
 * Start the download tracker, resetting internal state and using the
 * given sw-toolbox router.
 *
 * This should only be called once, though it may be called multiple
 * times during tests. If it's called while fetches are being managed, then
 * future behaviour of the tracker may be undefined (and not useful).
 *
 * @param toolboxRouter
 * @param {Boolean} isDebug Debug mode enable or disabled
 * @param {Object} [opts] Options object
 * @param {string} [opts.mode] Compatibility mode of the DownloadTracker. Either 'workbox' or 'sw-toolbox'.
 */
export const startDownloadTracker = (toolboxRouter, isDebug, options = {}) => {
    router = toolboxRouter
    debug = !!isDebug

    // Reset the internal state
    downloadsInProgress = 0
    maxDownloads = DEFAULT_MAX_DOWNLOADS
    priorityFilters = []
    clientPorts = []
    previousNetworkState = undefined
    mode = options.mode || COMPATIBILITY_MODES.SWTOOLBOX

    // Set the global request handler
    handleEvent = getEventHandler(mode)

    // Clear the pending arrays
    for (const priority in pendingFetches) {
        /* istanbul ignore next */
        if (pendingFetches.hasOwnProperty(priority)) {
            pendingFetches[priority] = []
        }
    }
}
