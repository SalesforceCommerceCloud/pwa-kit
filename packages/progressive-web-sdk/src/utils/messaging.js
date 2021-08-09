/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/messaging
 */
import {DEFAULT_CHANNEL} from '../store/push-messaging/constants'
import {loadScriptAsPromise} from './utils'

// PWA Messaging Client for Mobify's messaging platform
const MESSAGING_PWA_CLIENT_PATH = 'https://webpush-cdn.mobify.net/pwa-messaging-client.js'

// Creating an early promise that users of the Messaging Client can
// chain from means they don't need to poll for its existence
const logMessagingSetupError = () =>
    console.error(
        '`LoaderUtils.createGlobalMessagingClientInitPromise` must be called before `setupMessagingClient`'
    )
let clientInitResolver = logMessagingSetupError
let clientInitRejecter = logMessagingSetupError

/**
 * Helper method to determine if the visitor is subscribed to this channel name
 * @function
 * @param {boolean} isSubscribed - whether the visitor is currently subscribed to any channel
 * @param {array} channels - The list of channels the visitor is subscribed to
 * @param {string} [channelName] - The channel name for this ask instance; if
 *                                 undefined then assumes broadcast channel
 * @returns {Boolean} - If the user is subscribed to the optional channel name
 * @example
 * import {isSubscribedToChannel} from 'progressive-web-sdk/dist/utils/messaging'
 *
 * isSubscribedToChannel(true, ['channel1', 'channel2']) // true
 *
 * isSubscribedToChannel(false, ['channel1', 'channel2'], 'channel1') // false
 */
export const isSubscribedToChannel = (isSubscribed, channels, channelName) => {
    return isSubscribed && (channelName ? channels.includes(channelName) : true)
}

/**
 * Determines whether an ask should be shown, based on the following conditions:
 * 1. Messaging Client is ready and says the visitor is eligible for push notifications
      (i.e. has not revoked push notification permissions or has granted them already)
 * 2. The visitor is subscribed, but has not yet subscribed to this channel
 * 3. There is no visit countdown in progress for this channel (or it was disabled)
 * 4. The visitor has seen the required number of pages on the site (which may be disabled)
 * @function
 * @param {function} logger - Is bound to the correct logger; for testing
 * @param {object} props - Properties used to determine whether to ask
 * @returns {Boolean} - true if "ask" can be shown, false otherwise
 * @example
 * import {shouldAsk} from 'progressive-web-sdk/dist/utils/messaging'
 */
export const shouldAsk = (
    logger,
    {
        showOnPageCount,
        channelName,
        isSubscribed,
        canSubscribe,
        channels,
        pageCount,
        visitCountdowns
    },
    alreadyShown
) => {
    // If `showOnPageCount` is false, then we disable page counts as a guard
    const modulus = showOnPageCount ? pageCount % showOnPageCount : 0
    const visitCountdown = visitCountdowns[channelName || DEFAULT_CHANNEL]
    let message = false

    if (!canSubscribe) {
        message =
            'Unable to subscribe. Messaging Client is not ready or notification permissions are blocked'
    } else if (isSubscribedToChannel(isSubscribed, channels, channelName)) {
        message = 'Already subscribed'
    } else if (visitCountdown > 0) {
        message = `Deferred until ${visitCountdown} more visit(s)`
    } else if (modulus > 0) {
        if (!alreadyShown) {
            // This avoids "flip-flopping" when the UI is already shown and the
            // page count changes. i.e. once it's shown, ignore page count changes
            message = `Waiting for ${showOnPageCount - modulus} more page visit(s)`
        }
    }

    const channelMessage = channelName ? `for channel ${channelName}` : ''

    if (message !== false) {
        logger.log(`Should not ask ${channelMessage}: ${message}`)
        return false
    }

    logger.log('Can ask', channelMessage)
    return true
}

/**
 * Return true if and only if both the enabled and supported flags in
 * `window.Progressive.Messaging` are truthy. These flags are set by the
 * PWA loader, so they may be tested at any time after the PWA is loaded.
 * If this function is called before the loader runs, it will return
 * false.
 * If this function returns false, then Messaging is not available at all,
 * and no UI for it need be (or should be) shown.
 * If this function returns true, then Messaging has been configured in the
 * PWA and the browser supports it, *but* the user may have blocked
 * notifications, or not be subscribed, or be running in a mode (such as
 * incognito) where subscriptions can't be created. Information on the
 * subscription status is provided when the Promise stored in
 * `window.Progressive.MessagingClientInitPromise` is resolved - see
 * the https://docs.mobify.com/progressive-web/latest/components/#!/PushMessagingController
 * for details.
 * @function
 * @returns {Boolean}
 * @example
 * import {isMessagingSupported} from 'progressive-web-sdk/dist/utils/messaging'
 *
 * isMessagingSupported()
 * // true
 */
export const isMessagingSupported = () => {
    const progressive = window.Progressive || {}
    const messaging = progressive.Messaging || {}
    // Always return a boolean
    return Boolean(messaging.enabled && messaging.supported)
}

/**
 * Creates a Promise: `window.Progressive.MessagingClientInitPromise` which will
 * be resolved or rejected later by the method `setupMessagingClient`.
 *
 * @private
 * @function
 * @param {boolean} messagingEnabled - if the messaging enabled
 * @returns {Promise.<*>}
 * @example
 * import {createGlobalMessagingClientInitPromise} from 'progressive-web-sdk/dist/utils/messaging'
 *
 * createGlobalMessagingClientInitPromise(true)
 */

export const createGlobalMessagingClientInitPromise = (messagingEnabled) => {
    if (!messagingEnabled || window.Progressive.MessagingClientInitPromise) {
        return // but it returns undefined, how does the rest run?
    }

    // But if the above returns, how does this even happen? This line never runs.
    // createGlobalMessagingClientInitPromise(false) // => this line never runs
    // So, how does window.Progressive.MessagingClientInitPromise have a promise?
    // Answer: it doesn't have a promise, because as I said, it never gets set
    // because this line never runs.
    // So, your test case is
    window.Progressive.MessagingClientInitPromise = new Promise((resolve, reject) => {
        clientInitResolver = resolve
        clientInitRejecter = reject
    })
}

/**
 * Start the asynchronous loading and intialization of the Messaging client,
 * storing a Promise in window.Progressive.MessagingClientInitPromise that
 * is resolved when the load and initialization is complete. If either load
 * or init fails, the Promise is rejected.
 *
 * @private
 * @function
 * @param {boolean} debug - check if it's in debug mode
 * @param {string} siteId - messaging site ID
 * @param {boolean} pwaMode - if it is in PWA mode
 * @returns {Promise.<*>}
 * @example
 * import {loadAndInitMessagingClient} from 'progressive-web-sdk/dist/utils/messaging'
 *
 * loadAndInitMessagingClient()
 */
export const loadAndInitMessagingClient = (debug, siteId, pwaMode) => {
    loadScriptAsPromise({
        id: 'progressive-web-messaging-client',
        src: MESSAGING_PWA_CLIENT_PATH,
        rejectOnError: true
    })
        .then(
            () =>
                // We assume window.Progressive will exist at this point.
                window.Progressive.MessagingClient
                    // so, we can probably do something similar here, maybe. Mock this
                    // method and then verify whether it was called.
                    .init({debug, siteId, pwaMode})
                    .then(clientInitResolver) // whatever gets fed into clientInitResolver as arguments.
        )
        /**
         * Potential errors:
         * - URIError thrown by `loadScriptAsPromise` rejection
         * - TypeError from `messagingClient.init` being undefined
         * - expected error if Messaging is unavailable on the device (i.e. Safari)
         */
        .catch(clientInitRejecter)

    return window.Progressive.MessagingClientInitPromise
}

// This function is for testing purposes
export const testResetClientInit = () => {
    clientInitResolver = logMessagingSetupError
    clientInitRejecter = logMessagingSetupError
}
