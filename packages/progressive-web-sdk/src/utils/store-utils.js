/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'

/**
 * Takes a plain state object and converts it to an immutable state object.
 * The result will match the shape required by the PWA reducers where
 * the top-most object is a plain object, each branches contents is an immutable map
 * except the UI branch which is a plain object and each branch inside is an immutable map
 * @function
 * @param {Object} stateObject - the plain state object
 * @returns {Object}
 * @example
 * import {convertStateObjectToStateImmutable} from 'progressive-web-sdk/dist/utils/store-utils'
 *
 * convertStateObjectToStateImmutable({test: {key1: 'value1', key2: 'value2'}}))
 * // { test: Map { "key1": "value1", "key2": "value2" } }
 */
export const convertStateObjectToStateImmutable = (stateObject) => {
    const newState = {}

    Object.keys(stateObject).forEach((storeBranch) => {
        if (storeBranch === 'ui') {
            newState.ui = {}
            Object.keys(stateObject.ui).forEach((uiBranch) => {
                newState.ui[uiBranch] = Immutable.fromJS(stateObject.ui[uiBranch])
            })
        } else if (storeBranch === 'offline') {
            // Immutable.fromJS wont recognize and create sets
            // Handle this branch of the store separately so we
            // can make sure fetchedPages ends up a set
            newState.offline = Immutable.fromJS(stateObject.offline).set(
                'fetchedPages',
                Immutable.Set(stateObject.offline.fetchedPages)
            )
        } else {
            newState[storeBranch] = Immutable.fromJS(stateObject[storeBranch])
        }
    })
    return newState
}
