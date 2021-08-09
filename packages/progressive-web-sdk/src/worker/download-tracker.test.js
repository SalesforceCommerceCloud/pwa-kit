/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import each from 'jest-each'
import sinon from 'sinon'

import {
    CONFIGURE_THROTTLING,
    HIGH,
    NORMAL,
    LOW,
    UNTHROTTLED,
    X_PWA_PRIORITY,
    downloadCompleteEvent,
    downloadStartedEvent,
    downloadThrottledEvent,
    NETWORK_BUSY_STATUS
} from '../utils/download-shared'

import {
    getStateForTests,
    getEventHandler,
    makeEvent,
    setDownloadsInProgress,
    startDownloadTracker,
    COMPATIBILITY_MODES
} from './download-tracker'

import {MessageChannel, Request} from 'sw-test-env'
import Logger from '../utils/logger'

const pendingPriorities = [HIGH, NORMAL, LOW]

const sandbox = sinon.sandbox.create()

// The tracker code expects to use ExtendableEvents rather than Events
// (because it's a service-worker module). We alias ExtendableEvent here
// to allow that to work.
window.ExtendableEvent = Event

/**
 * A mock sw-toolbox router, that will always return the current value
 * of mockHandler for any request.
 */
let mockHandler
const mockRouter = {
    match: () => {
        return mockHandler
    }
}

let messageChannel

// Set this to true if you're fixing up tests and need debug output
// everywhere
const debug = false

/**
 * Post a message to the DownloadTracker. Creates a new MessageEvent
 * and dispatches it. We assume that the tracker is listening.
 * Returns a Promise that resolves when we get a reply, with the event
 * data from the reply.
 */
const postMessageToTracker = (data) => {
    const event = new MessageEvent('message', {
        data,
        ports: [messageChannel.port2]
    })

    const promise = new Promise((resolve) => {
        messageChannel.port1.addEventListener('message', (event) => resolve(event.data), {
            once: true
        })
        messageChannel.port1.start()
    })

    dispatchEvent(event)

    return promise
}

/**
 * Fake a 'fetch' by creating and sending a FetchEvent. The parameters
 * are the same as Request.
 * Returns a Promise for the fetch
 */
const doFetch = (url, init) =>
    new Promise((resolve) => {
        const event = makeEvent('fetch', {request: new Request(url, init)})
        // This value can't be set via the Request constructor, but since
        // sw-test-env uses node-fetch under the hood, we can set it
        // directly.
        if (init && init.destination) {
            event.request.destination = init.destination
        }

        // We need to add a respondWith() method to the fetchEvent
        event.respondWith = (result) => resolve(result)

        dispatchEvent(event)
    })

let mockFetch // eslint-disable-line no-unused-vars

beforeEach(() => {
    // Reset mockHandler to null
    mockHandler = null

    Logger.setDebug(debug)

    // Create a new MessageChannel
    messageChannel = new MessageChannel()

    // Fake out fetch
    mockFetch = self.fetch = sandbox.stub()

    // Reset the tracker
    startDownloadTracker(mockRouter, debug)
})
afterEach(() => {
    messageChannel.port1.close()
    messageChannel.port2.close()
    messageChannel = null
    sandbox.restore()
    Logger.setDebug(false)
})

test('getEventHandler throws if no mode id passed in', () => {
    expect(() => {
        getEventHandler()
    }).toThrow()
})

test('getEventHandler returns handler for `sw-toolbox` mode', () => {
    const handler = getEventHandler(COMPATIBILITY_MODES.SWTOOLBOX)
    expect(handler).toBeDefined()
})

test('getEventHandler returns handler for `workbox` mode', () => {
    const handler = getEventHandler(COMPATIBILITY_MODES.WORKBOX)
    expect(handler).toBeDefined()
})

test('Initialization resets state', () => {
    const state = getStateForTests()
    expect(state.downloadsInProgress).toBe(0)
    expect(state.maxDownloads).toBe(2)
    expect(state.priorityFilters.length).toBe(0)
    expect(state.mode).toBe(COMPATIBILITY_MODES.SWTOOLBOX)
    expect(state.handleEvent).toBeDefined()
    pendingPriorities.forEach((priority) => expect(state.pendingFetches[priority].length).toBe(0))
    expect(state.debug).toBe(debug)
})

test('Configure message sets state and gets reply', () => {
    const filters = [
        {
            regexp: '.+',
            priority: HIGH
        }
    ]

    // Send a message, and validate the response when we get the reply
    return postMessageToTracker({
        command: CONFIGURE_THROTTLING,
        maxDownloads: 10,
        priorityFilters: filters,
        // If you're fixing up tests, you might want to set
        // this to true.
        debug: false
    }).then((data) => {
        expect(data).toBeDefined()
        expect(data.throttling).toBe(true)
        expect(data.maxDownloads).toBe(10)

        const state = getStateForTests()
        expect(state.priorityFilters.length).toBe(filters.length)
    })
})

each([
    [
        'filter',
        {
            // Set priority using filters (init is undefined)
            filters: [
                {
                    regexp: 'http://somewhere.+high',
                    priority: HIGH
                }
            ]
        }
    ],
    [
        'header',
        {
            // Set priority using headers (filters is undefined)
            init: {
                headers: {
                    [X_PWA_PRIORITY]: HIGH
                }
            }
        }
    ],
    [
        'destination',
        {
            // Set priority using destination
            init: {
                destination: 'script'
            }
        }
    ]
]).test('Priority set via %s', (name, config) => {
    const url = 'http://somewhere.over.the.rainbow/way-up-high'
    const expectedPriority = HIGH

    // A verify function to check the state when the download
    // is throttled.
    const downloadThrottled = (resolve, reject) => (event) => {
        try {
            const url = event.url
            expect(url).toBe(url)

            const state = getStateForTests()
            const pending = state.pendingFetches[expectedPriority]
            const item = pending.find((item) => item.request.url === url)

            expect(item).toBeDefined()

            // Now we can resolve the Promise
            resolve()
        } catch (e) {
            reject(e)
        }
    }

    // Configure.
    return postMessageToTracker({
        command: CONFIGURE_THROTTLING,
        maxDownloads: 1,
        priorityFilters: config.filters,
        // If you're fixing up tests, you might want to set
        // this to true.
        debug: false
    }).then(() => {
        // Fake a download in progress so that the download is throttled
        setDownloadsInProgress(1)

        // Return a Promise resolved or rejected by the verifier
        return new Promise((resolve, reject) => {
            // Set up the verification listener
            addEventListener(downloadThrottledEvent, downloadThrottled(resolve, reject), {
                once: true
            })

            // Start the fetch (ignoring the result for this test)
            doFetch(url, config.init)
        })
    })
})

each([
    [
        "Doesn't throttle when idle",
        {
            downloadsInProgress: 0,
            expectAllowed: true,
            priority: NORMAL
        }
    ],
    [
        "Doesn't throttle when no throttling configured",
        {
            maxDownloads: 0,
            downloadsInProgress: 2,
            expectAllowed: true,
            priority: NORMAL
        }
    ],
    [
        "Doesn't throttle when priority is UNTHROTTLED",
        {
            downloadsInProgress: 1,
            expectAllowed: true,
            priority: UNTHROTTLED
        }
    ],
    [
        'Throttles when busy',
        {
            downloadsInProgress: 1,
            expectAllowed: false,
            priority: HIGH
        }
    ]
]).test('%s', (name, config) => {
    const url = 'http://somewhere.over.the.rainbow/weigh-a-pie'

    const verifierEvent = config.expectAllowed ? downloadStartedEvent : downloadThrottledEvent

    // Configure the handler to immediately complete the request
    mockHandler = () => Promise.resolve()

    // Configure.
    return postMessageToTracker({
        command: CONFIGURE_THROTTLING,
        maxDownloads: config.maxDownloads !== undefined ? config.maxDownloads : 1,
        // If you're fixing up tests, you might want to set
        // this to true.
        debug: config.debug
    }).then(() => {
        // Set the number of downloads in progress
        setDownloadsInProgress(config.downloadsInProgress)

        return new Promise((resolve) => {
            // When we get the event we expect, we
            // resolve this promise (and we're done).
            addEventListener(verifierEvent, resolve, {once: true})

            // Start the fetch (ignoring the result for this test),
            // passing the priority via a header.
            doFetch(url, {
                headers: {
                    [X_PWA_PRIORITY]: config.priority
                }
            })
        })
    })
})

test('Starts pending fetches in correct order', () => {
    const fetches = [
        {
            url: 'https://low-priority-01/',
            priority: LOW,
            expectedIndex: 4
        },
        {
            url: 'https://high-priority-01/',
            priority: HIGH,
            expectedIndex: 0
        },
        {
            url: 'https://low-priority-02/',
            priority: LOW,
            expectedIndex: 5
        },
        {
            url: 'https://normal-priority-01/',
            priority: NORMAL,
            expectedIndex: 2
        },
        {
            url: 'https://high-priority-02/',
            priority: HIGH,
            expectedIndex: 1
        },
        {
            url: 'https://normal-priority-02/',
            priority: NORMAL,
            expectedIndex: 3
        }
    ]

    // Configure the handler to immediately complete the request
    mockHandler = () => Promise.resolve()

    // This is called for every fetch that's started. We verify that the
    // fetches are started in the right order.
    let fetchIndex = 0
    const downloadStarted = (reject) => (event) => {
        try {
            const url = event.url
            expect(url).toBeDefined()

            // Look up this fetch by URL
            const data = fetches.find((data) => data.url === url)
            expect(data).toBeDefined()

            // Verify that it came in the correct order
            expect(data.expectedIndex).toBe(fetchIndex++)
        } catch (e) {
            reject(e)
        }
    }

    // This is called for every fetch that's throttled. When all the fetches
    // are throttled, we allow them to start.
    let pendingFetches = fetches.length
    const downloadThrottled = (reject) => () => {
        if (--pendingFetches === 0) {
            dispatchEvent(makeEvent(downloadCompleteEvent, {url: 'fake blocking request'}))
        } else if (pendingFetches < 0) {
            reject(new Error('too many downloadThrottled events sent'))
        }
    }

    // This is called for every fetch that completes. When all the fetches
    // have completed, we resolve the test Promise.
    let completedFetches = 0
    const downloadComplete = (resolve) => () => {
        if (++completedFetches === fetches.length) {
            resolve()
        }
    }

    return postMessageToTracker({
        command: CONFIGURE_THROTTLING,
        maxDownloads: 1,
        // If you're fixing up tests, you might want to set
        // this to true.
        debug: false
    })
        .then(() => {
            // Set the number of downloads in progress
            setDownloadsInProgress(1)

            return new Promise((resolve, reject) => {
                // Validate the fetch order via downloadStarted events
                addEventListener(downloadStartedEvent, downloadStarted(reject))

                // When we get the last downloadThrottled event, we
                // allow the fetches to start.
                addEventListener(downloadThrottledEvent, downloadThrottled(reject))

                // We also count the downloadComplete events.
                addEventListener(downloadCompleteEvent, downloadComplete(resolve))

                // Start the fetches, passing the priorities via a header.
                fetches.forEach((data) =>
                    doFetch(data.url, {
                        headers: {
                            [X_PWA_PRIORITY]: data.priority
                        }
                    })
                )
            })
        })
        .finally(() => {
            removeEventListener(downloadCompleteEvent, downloadComplete)
            removeEventListener(downloadStartedEvent, downloadStarted)
            removeEventListener(downloadThrottledEvent, downloadThrottled)
        })
})

test('Handles a failed fetch', (done) => {
    // Configure the handler to immediately reject the request
    mockHandler = () => Promise.reject(new Error('This is fine'))
    addEventListener(downloadCompleteEvent, () => done(), {once: true})
    return doFetch('http://an.actors.life.for.me/')
        .then(() => {
            throw new Error('Did not expect fetch to succeed')
        })
        .catch(() => {})
})

test('Updates network busy status', () => {
    let networkBusy
    let testPromiseResolve

    // A MessageEvent handler that watches for network-busy updates
    const busyHandler = (event) => {
        const data = event.data
        expect(data).toBeDefined()
        if (data.command === NETWORK_BUSY_STATUS) {
            const wasBusy = networkBusy
            networkBusy = event.data.networkBusy

            // If we see a transition from busy to not-busy, we're done
            if (wasBusy && !networkBusy) {
                testPromiseResolve()
            }
        }
    }

    // A mock Handler for fetches that allows us to delay
    // the resolution of the fetch by enough time that there
    // should be a network-busy status update.
    mockHandler = () =>
        new Promise((resolve) => {
            setTimeout(resolve, 100)
        })

    // Configure the tracker so that we can get messages back from it.
    postMessageToTracker({
        command: CONFIGURE_THROTTLING,
        maxDownloads: 2,
        debug
    })

    return new Promise((resolve) => {
        testPromiseResolve = resolve

        // Hook the handler up to get network busy updates
        messageChannel.port1.addEventListener('message', busyHandler)

        // Start the fetch
        doFetch('http://all.the.worlds.a.stage/')
    }).finally(() => {
        messageChannel.port1.removeEventListener('message', busyHandler)
    })
})
