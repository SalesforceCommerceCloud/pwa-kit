/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {
    DEFAULT_CHANNEL,
    VISIT_COUNTDOWNS,
    PERMA_DURATION,
    PAGE_COUNT,
    ACTIVE_VISIT_DURATION
} from '../store/push-messaging/constants'
import Logger from './logger'
import PushMessagingStore from '../store/push-messaging/push-messaging-store'

let storage
let logger

/**
 * Creates local instances of PushMessaginStore and Logger, for use in other
 * methods. Call this first before any other methods.
 * @function
 * @returns {Object}
 * @example
 * import {initStorage} from 'progressive-web-sdk/dist/utils/messaging-state'
 */
export const initStorage = () => {
    storage = storage || new PushMessagingStore('pw')
    logger = logger || new Logger('[Messaging UI]')

    return storage
}
/**
 * Sets the provided countdowns object in local storage.
 * @function
 * @param {object} countdowns - The visit countdowns object to set in storage
 * @returns {Object} - The provided `countdowns` argument
 * @example
 * import {setVisitCountdownsInStorage} from 'progressive-web-sdk/dist/utils/messaging-state'
 */
export const setVisitCountdownsInStorage = (countdowns) => {
    storage.set(VISIT_COUNTDOWNS, countdowns, PERMA_DURATION)

    return countdowns
}

/**
 * Gets the visit countdowns object from local storage
 * @function
 * @returns {Object} - current visit countdowns
 * @example
 * import {getVisitCountdowns} from 'progressive-web-sdk/dist/utils/messaging-state'
 */
export const getVisitCountdowns = () => {
    return storage.get(VISIT_COUNTDOWNS) || {}
}

/**
 * Adds the optionally provided channel name, or "default" to the visit countdowns
 * object, with the provided `visitsToWait` argument, which is then set in local
 * storage.
 * @function
 * @param {number} visitsToWait - The number of visits to wait before showing an ask again
 * @param {string} channelName=DEFAULT_CHANNEL - Optional channel name (default is 'broadcast')
 * @returns {Object} - Current visit countdowns
 * @example
 * import {startVisitCountdown} from 'progressive-web-sdk/dist/utils/messaging-state'
 */
export const startVisitCountdown = (visitsToWait, channelName = DEFAULT_CHANNEL) => {
    const countdowns = getVisitCountdowns()
    countdowns[channelName] = visitsToWait

    return setVisitCountdownsInStorage(countdowns)
}

/**
 * Retrieves visit countdowns from local storage, decreases each key's value by 1,
 * then sets the value in local storage again.
 * @function
 * @returns {Object} - current visit countdowns
 * @example
 * import {decreaseVisitCountdowns} from 'progressive-web-sdk/dist/utils/messaging-state'
 */
export const decreaseVisitCountdowns = () => {
    const countdowns = getVisitCountdowns()

    for (const counter in countdowns) {
        /* istanbul ignore else */
        if (countdowns.hasOwnProperty(counter)) {
            countdowns[counter] = Math.max(0, countdowns[counter] - 1)
        }
    }

    return setVisitCountdownsInStorage(countdowns)
}

/**
 * Gets the current page count from local storage.
 * @function
 * @returns {Number} - The current page count, or 0 if not found in storage
 * @example
 * import {getPageCount} from 'progressive-web-sdk/dist/utils/messaging-state'
 */
export const getPageCount = () => {
    return storage.get(PAGE_COUNT) || 0
}

/**
 * Sets the page count in storage using the provided pageCount argument
 * @function
 * @param {number} pageCount - The page count to set in storage
 * @returns {Number} - The provided `pageCount` argument
 * @example
 * import {setPageCount} from 'progressive-web-sdk/dist/utils/messaging-state'
 */
export const setPageCount = (pageCount) => {
    return storage.set(PAGE_COUNT, pageCount, ACTIVE_VISIT_DURATION)
}

/**
 * Updates and retrieves the current page count and visit countdowns from local
 * storage, decreasing visit countdowns if page count was not found.
 * @function
 * @returns {Object}
 *   - pageCount: the current page count
 *   - visitCountdowns: the current visit countdowns
 * @example
 * import {updateState} from 'progressive-web-sdk/dist/utils/messaging-state'
 */
export const updateState = () => {
    let pageCount = getPageCount()
    let countdowns

    // If pageCount is 0, it means it wasn't found in storage - this indicates
    // it expired and we should decrement visit countdowns
    if (pageCount === 0) {
        logger.log('Visit elapsed, decreasing visit countdowns.')
        countdowns = decreaseVisitCountdowns()
    } else {
        countdowns = getVisitCountdowns()
    }

    setPageCount(++pageCount)

    return {
        pageCount,
        visitCountdowns: countdowns
    }
}
