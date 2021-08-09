/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import AskFrame from './ask-frame'
import {shouldAsk} from '../../utils/messaging'
import {updateState, initStorage} from '../../utils/messaging-state'
import Logger from '../../utils/logger'

let logger

const DEFAULT_ASK_CONFIG = {
    showOnPageCount: 3,
    deferOnDismissal: 3
}

/**
 * Handles notification click events sent from the Messaging Client by directly
 * modifying window.location.href
 *
 * @param {object} event - The Event direct from the Messaging Client
 * @param {object) event.detail - Contains the `url` key from the message
 * @param {string} event.detail.url - The string that we should set href to
 */
export const handleNotificationClick = (event) => {
    const url = event.detail && event.detail.url

    if (typeof url === 'string' && url.length > 0) {
        window.location.href = url
    }
}

export const initMessaging = (configuration) => {
    // Initialize the logger and bind it to shouldAsk method
    logger = new Logger('[Messaging UI]')
    initStorage()
    const boundShouldAsk = shouldAsk.bind(this, logger)

    const defaultAskConfig = Object.assign({}, DEFAULT_ASK_CONFIG, configuration.defaultAsk)

    return window.Progressive.MessagingClientInitPromise.then((state) => {
        logger.log('Initializing...')

        // Register with the Messaging Client for notification click events that
        // occur while the visitor is viewing the website
        window.Mobify.WebPush.PWAClient.register(
            handleNotificationClick,
            window.Mobify.WebPush.PWAClient.Events.notificationClick
        )

        const {pageCount, visitCountdowns} = updateState()

        // Add more values to state that we got from the Messaging Client, for
        // use with shouldAsk method
        const currentSubscriptionState = Object.assign({}, state, {
            showOnPageCount: defaultAskConfig.showOnPageCount,
            isSubscribed: state.subscribed,
            pageCount,
            visitCountdowns
        })

        const askFrame = new AskFrame(defaultAskConfig)

        logger.log('Init complete')

        // If the developer wants us to automatically do everything, then we
        // will carry out the logic for displaying the ask ourselves
        if (defaultAskConfig.auto === true && boundShouldAsk(currentSubscriptionState)) {
            // Create the "ask" iframe
            askFrame.create()
            askFrame.setupListeners()
            askFrame.show()
        }

        return {askFrame, currentSubscriptionState}
    })
}
