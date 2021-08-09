/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import reducer, {initialState} from './reducer'
import * as actions from './actions'
import * as constants from './constants'

test('unknown action type leaves state unchanged', () => {
    const action = {
        type: 'qwertyuiop'
    }
    expect(reducer(initialState, action)).toBe(initialState)
})

test('stateUpdate sets values of isReady, subscribed, canSubscribe, channels, and status', () => {
    const update = {
        isReady: true,
        subscribed: true,
        canSubscribe: true,
        channels: [constants.DEFAULT_CHANNEL],
        status: [constants.MESSAGING_STATUS.READY]
    }
    const inputState = initialState.mergeDeep(update)

    const action = actions.stateUpdate(update)
    expect(reducer(initialState, action).equals(inputState)).toBe(true)
})

test('messagingSystemAskShown sets value of systemAskShown', () => {
    const inputState = initialState.set('systemAskShown', true)
    const action = actions.messagingSystemAskShown(true)

    expect(reducer(initialState, action).equals(inputState)).toBe(true)
})

test('onRehydratedPageCount increases existing pageCount by the provided value', () => {
    const inputState = initialState.set(constants.PAGE_COUNT, 3)
    const action = actions.onRehydratedPageCount(3)
    const outputState = initialState.set(constants.PAGE_COUNT, 6)

    expect(reducer(inputState, action).equals(outputState)).toBe(true)
})

test('onPageCountIncrement increases pageCount by 1', () => {
    const inputState = initialState.set(constants.PAGE_COUNT, 1)
    const action = actions.onPageCountIncrement()

    expect(reducer(initialState, action).equals(inputState)).toBe(true)
})

test('onRehydratedVisitCountdowns sets visitCountdowns to the provided value', () => {
    const countdowns = {
        default: 3,
        'new-deals': 4
    }

    const inputState = initialState.mergeDeep({
        [constants.VISIT_COUNTDOWNS]: countdowns
    })

    const action = actions.onRehydratedVisitCountdowns(countdowns)

    expect(reducer(initialState, action).equals(inputState)).toBe(true)
})

test('onVisitCountdownStarted updates visitCountdowns object with visit countdown for provided channel name', () => {
    const channelName = constants.DEFAULT_CHANNEL
    const inputState = initialState.setIn([constants.VISIT_COUNTDOWNS, channelName], 3)
    const action = actions.onVisitCountdownStarted(3, channelName)

    expect(reducer(initialState, action).equals(inputState)).toBe(true)
})

test('onDecreaseVisitCountdowns decreases all visit countdowns by 1', () => {
    const inputState = initialState.mergeDeep({
        [constants.VISIT_COUNTDOWNS]: {
            default: 3,
            'new-deals': 4
        }
    })

    const outputState = initialState.mergeDeep({
        [constants.VISIT_COUNTDOWNS]: {
            default: 2,
            'new-deals': 3
        }
    })

    const action = actions.onDecreaseVisitCountdowns()

    expect(reducer(inputState, action).equals(outputState)).toBe(true)
})

test('onLocaleSet sets value of locale', () => {
    const locale = 'en-US'
    const action = actions.onLocaleSet(locale)
    const outputState = initialState.set('locale', locale)

    expect(reducer(initialState, action).equals(outputState)).toBe(true)
})
