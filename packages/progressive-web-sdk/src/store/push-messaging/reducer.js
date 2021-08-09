/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {fromJS} from 'immutable'
import {handleActions} from 'redux-actions'

import * as messagingActions from './actions'
import {
    PAGE_COUNT,
    VISIT_COUNTDOWNS,
    VISITS_TO_WAIT,
    CHANNEL_NAME,
    MESSAGING_STATUS
} from './constants'
import {isMessagingSupported} from '../../utils/messaging'
import {mergePayload} from '../../utils/reducer-utils'

export const initialState = fromJS({
    subscribed: false,
    canSubscribe: false,
    channels: [],
    [PAGE_COUNT]: 0,
    [VISIT_COUNTDOWNS]: {},
    systemAskShown: false,
    locale: '',
    isReady: false, // Deprecated
    isSupported: isMessagingSupported(),
    status: MESSAGING_STATUS.LOADING
})

const pushMessagingReducer = handleActions(
    {
        [messagingActions.stateUpdate]: mergePayload,
        [messagingActions.messagingSystemAskShown]: mergePayload,
        [messagingActions.onRehydratedPageCount]: (state, {payload}) => {
            return state.update(PAGE_COUNT, (pageCount) => pageCount + payload)
        },
        [messagingActions.onPageCountIncrement]: (state) => {
            return state.update(PAGE_COUNT, (pageCount) => ++pageCount)
        },
        [messagingActions.onRehydratedVisitCountdowns]: mergePayload,
        [messagingActions.onVisitCountdownStarted]: (state, {payload}) => {
            return state.setIn([VISIT_COUNTDOWNS, payload[CHANNEL_NAME]], payload[VISITS_TO_WAIT])
        },
        [messagingActions.onDecreaseVisitCountdowns]: (state) => {
            return state.update(VISIT_COUNTDOWNS, (visitCountdowns) => {
                return visitCountdowns.map((value) => Math.max(--value, 0))
            })
        },
        [messagingActions.onLocaleSet]: mergePayload
    },
    initialState
)

export default pushMessagingReducer
