/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'
import {handleActions} from 'redux-actions'
import {
    receiveCartContents,
    receiveCartItems,
    receiveCartCustomContent,
    receiveCartTotals
} from '../../integration-manager/cart/results'
import {mergePayloadSkipList, mergePayload} from '../../utils/reducer-utils'

const cartReducer = handleActions(
    {
        [receiveCartContents]: mergePayloadSkipList,
        [receiveCartItems]: mergePayloadSkipList,
        [receiveCartCustomContent]: mergePayload,
        [receiveCartTotals]: mergePayload
    },
    Immutable.Map()
)

export default cartReducer
