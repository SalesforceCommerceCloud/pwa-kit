/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import Immutable from 'immutable'
import * as messagingSelectors from './selectors'
import * as constants from './constants'

beforeEach(() => {
    window.Progressive = {
        Messaging: {
            enabled: false,
            supported: false
        }
    }
})

const state = {
    pushMessaging: Immutable.fromJS({
        isReady: false,
        subscribed: false,
        canSubscribe: false,
        channels: [constants.DEFAULT_CHANNEL, 'foo'],
        [constants.PAGE_COUNT]: 0,
        [constants.VISIT_COUNTDOWNS]: {
            [constants.DEFAULT_CHANNEL]: 3,
            'new-deals': 4
        },
        systemAskShown: false,
        locale: 'en-US',
        status: constants.MESSAGING_STATUS.LOADING
    })
}

test('isSubscribed creates a selector that check whether we are not subscribed', () => {
    expect(messagingSelectors.isSubscribed(state)).toBe(false)
})

test('canSubscribe creates a selector that check whether we can subscribe', () => {
    expect(messagingSelectors.canSubscribe(state)).toBe(false)
})

test('getPageCount creates a selector that returns the current page count', () => {
    expect(messagingSelectors.getPageCount(state)).toBe(0)
})

test('getVisitCountdowns creates a selector that returns the current visit countdowns', () => {
    expect(messagingSelectors.getVisitCountdowns(state)).toEqual(
        Immutable.Map({
            [constants.DEFAULT_CHANNEL]: 3,
            'new-deals': 4
        })
    )
})

test('getChannels creates a selector that returns channels we are subscribed to', () => {
    expect(messagingSelectors.getChannels(state)).toEqual(
        Immutable.List([constants.DEFAULT_CHANNEL, 'foo'])
    )
})

test('isSystemAskShown creates a selector that check whether the system ask is being shown', () => {
    expect(messagingSelectors.isSystemAskShown(state)).toBe(false)
})

test('getLocale creates a selector that returns the current set locale', () => {
    expect(messagingSelectors.getLocale(state)).toBe('en-US')
})

test('isMessagingReady creates a selector that returns true when Messaging has loaded successfully', () => {
    expect(messagingSelectors.isMessagingReady(state)).toBe(false)
})

test('isMessagingSupported creates a selector that returns true if the feature is supported,', () => {
    expect(messagingSelectors.isSupported(state)).toBe(false)
})

test('getStatus creates a selector that returns the status of the Messaging client', () => {
    expect(messagingSelectors.getStatus(state)).toEqual(constants.MESSAGING_STATUS.LOADING)
})
