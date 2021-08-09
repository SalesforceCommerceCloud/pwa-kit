/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/reducer-utils
 */
import Immutable from 'immutable'

/**
 * This performs a deep merge of the state and payload. It returns a copy of the
 * merged state.
 * @function
 * @param {object} state - object or array state
 * @param {object} payload - data to be merged into the state
 * @returns {Object}
 * @example
 * import {mergePayload} from 'progressive-web-sdk/dist/utils/reducer-utils'
 */
export const mergePayload = (state, {payload}) => state.mergeDeep(payload)

const isList = Immutable.List.isList
/**
 * Ensures the new list is always used when merging Maps that contain lists.
 * @function
 * @param {object} a - first object to merge
 * @param {object} b - second object to merge
 * @returns {Object}
 * @see https://github.com/facebook/immutable-js/issues/762
 * @example
 * import {skipListsMerger} from 'progressive-web-sdk/dist/utils/reducer-utils'
 */
export const skipListsMerger = (a, b) => {
    if (a && a.mergeWith && !isList(a) && !isList(b)) {
        return a.mergeWith(skipListsMerger, b)
    }
    return b
}

/**
 * This performs a merge of the state with the payload by using
 * `skipListsMerger` as the merge function.
 * @function
 * @param {object} state - object or array state
 * @param {object} payload - data to be merged into the state
 * @returns {Object}
 * @example
 * import {mergePayloadSkipList} from 'progressive-web-sdk/dist/utils/reducer-utils'
 */
export const mergePayloadSkipList = (state, {payload}) => state.mergeWith(skipListsMerger, payload)

/**
 * This merges the payload into the state at the designated `customPath`.
 * Regardless of what's added to the `customPath`, the final node in the path
 * will always be treated as `custom`.
 * set to provided value.
 * @function
 * @param {array|string} customPath - the name of custom path
 * @returns {Function}
 * @example
 * import {setCustomContent} from 'progressive-web-sdk/dist/utils/reducer-utils'
 *
 * const myReducer = handleActions({
 *     // Merges to state.custom
 *     [someAction0.action]: setCustomContent(),
 *
 *     // Merges to state.products.custom
 *     [someAction1.action]: setCustomContent('products'),
 *
 *     // merges to state.products.categories.custom
 *     [someAction2.action]: setCustomContent(['products', 'categories'])
 * })
 */
export const setCustomContent = (...customPath) =>
    /**
     * @param {object} state - object or array state
     * @param {object} payload - data to be merged into the state
     * @returns {Object}
     */
    (state, {payload}) => state.setIn([...customPath, 'custom'], payload)
