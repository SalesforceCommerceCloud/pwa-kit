/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import isReactRoute from '../../routing/is-react-route'
import {browserHistory} from '../../routing'
import {extractPathFromURL} from '../../utils/utils'

import Logger from '../../utils/logger'
const logger = new Logger('[Messaging UI]')

import {createAction} from '../../utils/action-creation'

import PushMessagingStore from './push-messaging-store'
import * as messagingSelectors from './selectors'
import {
    PAGE_COUNT,
    VISIT_COUNTDOWNS,
    VISITS_TO_WAIT,
    CHANNEL_NAME,
    DEFAULT_CHANNEL,
    ACTIVE_VISIT_DURATION,
    PERMA_DURATION
} from './constants'

export const onRehydratedPageCount = createAction('[Push Messaging] Page Count Rehydrated')
export const onRehydratedVisitCountdowns = createAction(
    '[Push Messaging] Visit Countdowns Rehydrated',
    [VISIT_COUNTDOWNS]
)
export const stateUpdate = createAction('[Push Messaging] State Updated')
export const onDecreaseVisitCountdowns = createAction('[Push Messaging] Decrease Visit Countdowns')
export const onPageCountIncrement = createAction('[Push Messaging] Increment Page Count')
export const onVisitCountdownStarted = createAction('[Push Messaging] Visit Countdown Set', [
    VISITS_TO_WAIT,
    CHANNEL_NAME
])
export const messagingSystemAskShown = createAction('[Push Messaging] System Ask Shown/Not Shown', [
    'systemAskShown'
])
export const setVisitsToWaitIfDismissed = createAction(
    '[Push Messaging] Set Visits to Wait when Dismissed',
    ['visitsToWaitIfDismissed']
)
export const onNotificationClick = createAction('[Push Messaging] Notification Clicked', ['url'])
export const onLocaleSet = createAction('[Push Messaging] Locale Set', ['locale'])

const storage = new PushMessagingStore('pw')
let visitEndTimestamp

/**
 * Sets a visit timestamp hours into the future. Each time the page count is
 * incremented, this value is checked against the current time (see `incrementPageCount`)
 *
 * @param {number} [durationOverride] - Used for testing
 */
export const setVisitEndTimestamp = (durationOverride) => () => {
    const date = new Date()
    const duration =
        typeof durationOverride !== 'undefined' ? durationOverride : ACTIVE_VISIT_DURATION

    visitEndTimestamp = date.getTime() + duration * 1000 // convert to milliseconds

    logger.log(
        `Current time is ${date.toTimeString()}.`,
        `Setting new visit end timestamp for ${new Date(visitEndTimestamp).toTimeString()}`
    )
}

/**
 * Exported for testing. Returns the value of the local variable `visitEndTimestamp`
 *
 * @returns {number} - Visit end timestamp value in milliseconds
 */
export const getVisitEndTimestamp = () => visitEndTimestamp

/**
 * loader.js sets up messaging by adding a promise on `window.Progressive` that
 * we can chain off - once the Messaging Client is loaded it resolves and we can
 * safely call methods on window.Progressive.MessagingClient
 *
 * @returns {boolean} - true if promise is present, false otherwise
 */
const wasMessagingInitialized = () => {
    if (typeof window.Progressive.MessagingClientInitPromise === 'undefined') {
        console.error(
            'Push Messaging is not ready: the client library may have failed to load or the project is misconfigured.\n' +
                '- Is the Push Messaging feature enabled for your project?\n' +
                '- Did you add the PushMessagingController component to the App container?\n'
        )
        return false
    }

    return true
}

/**
 * Helper method to log error messages to console when invalid string arg is provided
 *
 * @param {string} logName - Prepended to log message
 * @param {string} argument - The argument to check for string type and length
 * @returns {boolean} - true if invalid string argument, false otherwise
 */
const isInvalidString = (logName, argument) => {
    if (typeof argument !== 'string' || argument.length === 0) {
        logger.forceLog(`${logName} must be specified as a string.`)
        return true
    }

    return false
}

/**
 * Retrieves the visit countdowns object from the Redux store, and adds it to
 * local storage.
 */
export const setVisitCountdownsInStorage = () => (_, getState) => {
    const currentCountdowns = messagingSelectors.getVisitCountdowns(getState()).toJS()
    storage.set(VISIT_COUNTDOWNS, currentCountdowns, PERMA_DURATION)
}

/**
 * Starts a visit countdown that can be used to help in determining eligibility
 * of a particular Push Messaging "ask" component
 *
 * Is persisted in local storage for 1 year
 *
 * @param {number} visitsToWait - how many visits to wait for
 * @param {string} [channelName] - optional name of channel
 */
export const startVisitCountdown = (visitsToWait, channelName) => (dispatch) => {
    channelName = channelName || DEFAULT_CHANNEL
    dispatch(onVisitCountdownStarted(visitsToWait, channelName))

    logger.log(`started visit countdown of ${visitsToWait} for channel ${channelName}`)
    dispatch(setVisitEndTimestamp())
    dispatch(setVisitCountdownsInStorage())
}

/**
 * Decreases the current visit countdown by 1, saving the new value in local storage
 */
export const decreaseVisitCountdowns = () => (dispatch) => {
    // First, decrease the visit countdowns in Redux store
    dispatch(onDecreaseVisitCountdowns())

    logger.log('Decreased visit countdowns by 1')
    // Finally, update localStorage with the latest page count
    dispatch(setVisitCountdownsInStorage())
}

/**
 * Triggers the system-ask dialog to ask user for permissions. If user has already
 * provided permission, subscribes or unsubscribes them to the provided channel(s).
 * Provide a key representing the channel name, and a truthy value to subscribe
 * or falsy value to unsubscribe. Providing zero arguments will cause the Messaging
 * Client to subscribe the user to a `broadcast` channel.
 *
 * e.g.
 * {
 *   newDeals: true,
 *   priceDrops: false
 * }
 *
 * @param {object} [channels] - list of channels to un/subscribe to
 * @returns {Promise} resolves to a Push Messaging State, or undefined in case of error
 */
export const subscribe = (channels) => (dispatch, getState) => {
    if (!wasMessagingInitialized()) {
        return Promise.resolve()
    }

    return window.Progressive.MessagingClientInitPromise.then(() => {
        const isSubscribed = messagingSelectors.isSubscribed(getState())
        // The system ask is only shown if the user has not already subscribed
        // to push notifications on the domain
        if (!isSubscribed) {
            dispatch(messagingSystemAskShown(true)) // Let app know system ask is in progress
        }

        let message = 'Attempting subscription'

        // We only log channel names in the case that they were supplied -
        // otherwise we're only subscribing to the `broadcast` channel
        if (channels) {
            const channelKeys = Object.keys(channels)
            message += ` to channel(s): ${channelKeys.join(', ')}`
        }

        logger.log(message)
    })
        .then(() => window.Progressive.MessagingClient.subscribe(channels))
        .then((state) => {
            logger.forceLog('Attempted subscription. Result:', state)
            // It's safe to always dispatch this action
            dispatch(messagingSystemAskShown(false)) // Let app know the system ask is now hidden
            return state
        })
        .catch(/* istanbul ignore next */ (err) => console.error(err))
}

/**
 * Abstracts the `subscribe` action above so that it can be directly bound as a
 * React component's `onClick` event handler
 *
 * Handlers for the `onClick` event receive a `SyntheticEvent`
 * (https://facebook.github.io/react/docs/events.html) object as an argument,
 * which the `subscribe` method above does not expect. Use `subscribeOnClick` as
 * the handler to ignore this argument
 *
 * @returns {Promise} resolves to a Push Messaging State, or undefined in case of error
 */
export const subscribeOnClick = () => subscribe()

/**
 * Informs the Push Messaging service that the given channel name was offered to the user
 * (Dispatch this action when UI asking user to subscribe to a channel has been shown,
 * typically in the `componentDidMount` and `componentDidUpdate` lifecycle methods)
 *
 * @param {string} [channel] - the name of the channel that was shown to the user
 * @returns {Promise} resolves to a Push Messaging State, or undefined in case of error
 */
// eslint-disable-next-line no-unused-vars
export const channelOfferShown = (channel) => (dispatch) => {
    if (!wasMessagingInitialized()) {
        return Promise.resolve()
    }

    return window.Progressive.MessagingClientInitPromise.then(() => {
        logger.log(
            `Notifying Messaging Client that channel ${channel || DEFAULT_CHANNEL} was displayed.`
        )
        return window.Progressive.MessagingClient.channelOfferShown(channel)
    }).catch(/* istanbul ignore next */ (err) => console.error(err))
}

/**
 * For internal use, this adds 1 to the existing page counter and is dispatched by `onRouteChanged`
 * Also persists the value in local storage (for 6 hours)
 *
 * Each time this is called, the current time is checked against the value of
 * `visitEndTimestamp` (which is set on app initialization). If the current time
 * is greater than the timestamp, we count that as a "visit" and decrease visit
 * counters.
 *
 * @param {number} [count] - the number to increment the page count by
 */
export const incrementPageCount = (count = 1) => (dispatch, getState) => {
    // First, increment the page count
    dispatch(onPageCountIncrement(count))

    // Now that we've updated the store, get the current page count
    const currCount = messagingSelectors.getPageCount(getState())

    // Finally, update localStorage with the latest page count
    storage.set(PAGE_COUNT, currCount, ACTIVE_VISIT_DURATION)

    // Compare current time to determine whether enough time has elapsed since
    // app start to constitute a "visit"
    if (Date.now() >= visitEndTimestamp) {
        logger.log('A visit has elapsed since application start.')
        dispatch(decreaseVisitCountdowns())
        dispatch(setVisitEndTimestamp())
    }
}

/**
 * For internal use, rehydrates any set page counts from local storage, and
 * adds it to Redux state
 */
export const rehydratePageCount = () => (dispatch) => {
    const fromStore = storage.get(PAGE_COUNT)

    if (fromStore !== null) {
        dispatch(onRehydratedPageCount(fromStore))
    } else {
        // Since page count wasn't in storage, it expired. Decrease visit countdowns
        dispatch(decreaseVisitCountdowns())
    }
}

/**
 * For internal use, rehydrates any set visit countdowns from  local storage, and
 * adds it to Redux state
 */
export const rehydrateVisitCountdowns = () => (dispatch) => {
    const fromStore = storage.get(VISIT_COUNTDOWNS)

    if (fromStore !== null) {
        dispatch(onRehydratedVisitCountdowns(fromStore))
    }
}

/**
 * Fired when a user clicks on a web push notification, the provided URL string
 * is first verified as a valid route in the React app, and then parsed as a relative
 * pathname. (including query string and hash)
 * If the URL provided does not match a valid route, then `location.href` is set
 * directly. (i.e. new page load)
 *
 * @param {string} url - a valid URL - typically from a Messaging Client event
 */
export const notificationClick = (url) => (dispatch) => {
    if (isReactRoute(url)) {
        const relativeUrl = extractPathFromURL(url, true, true)
        browserHistory.push(relativeUrl)
    } else {
        window.location.href = url
    }

    dispatch(onNotificationClick(url))
}

/**
 * Sets the given locale as an attribute on the Messaging subscription - this is
 * useful for sending translated push notifications to subscribers.
 *
 * @param {string} locale - The locale of the visitor
 * @returns {Promise} resolves to a Push Messaging State, or undefined in case of error
 */
export const setLocale = (locale) => (dispatch) => {
    if (!wasMessagingInitialized() || isInvalidString('Locale', locale)) {
        return Promise.resolve()
    }

    return window.Progressive.MessagingClientInitPromise.then(() => {
        logger.log(`Updating Messaging Client with locale: ${locale}.`)
        dispatch(onLocaleSet(locale))
        return window.Progressive.MessagingClient.setLocale(locale)
    }).catch(/* istanbul ignore next */ (err) => console.error(err))
}
