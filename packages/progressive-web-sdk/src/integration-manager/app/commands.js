/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {
    sendAddA2HSAnalytics,
    sendDismissA2HSAnalytics,
    sendA2HSPromptAnalytics
} from '../../analytics/actions'

let connector = {}

export const register = (commands) => {
    connector = commands
}

/**
 * Suggests products as the user types their search query
 * @function
 * @param {String} args Query string of what the user is typing
 */
export const getSearchSuggestions = (...args) => connector.getSearchSuggestions(...args)

/**
 * Submits a search for products
 * @function
 * @param {String} searchQuery The search term submitted by the user
 */
export const searchProducts = (searchQuery) => connector.searchProducts(searchQuery)

/**
 * Initializes the connector during app startup. This command dispatched
 * be called before any other integration manager commands are.
 * @function
 */
export const initApp = () => (dispatch) => {
    return dispatch(connector.initApp()).then(() => {
        const isPWA = typeof window !== 'undefined'
        if (isPWA) {
            window.addEventListener('beforeinstallprompt', (e) => {
                dispatch(sendA2HSPromptAnalytics())
                e.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'dismissed') {
                        dispatch(sendDismissA2HSAnalytics())
                    } else {
                        dispatch(sendAddA2HSAnalytics())
                    }
                })
            })
        }
    })
}
