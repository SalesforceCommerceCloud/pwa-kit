/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import Immutable from 'immutable'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import {sendA2HSUserPromptAnalytics} from '../../analytics/actions'
import * as actions from './actions'
import * as constants from './constants'

const mockStore = configureMockStore([thunk])

describe('the `promptEvent` action', () => {
    let store

    beforeEach(() => {
        store = mockStore({
            addToHomescreen: Immutable.fromJS({
                status: constants.HIDDEN
            })
        })
    })

    const mockEvent = (userChoice = {}) => ({
        userChoice: Promise.resolve(userChoice),
        prompt: jest.fn()
    })

    test('will call event.prompt() and dispatch an analytics action', () => {
        const event = mockEvent()
        const expectedActions = [sendA2HSUserPromptAnalytics()]

        store.dispatch(actions.promptEvent(event))
        expect(store.getActions()).toEqual(expectedActions)
        expect(event.prompt).toBeCalled()
    })

    test('will also dispatch `setStatus(HIDDEN)` if the userChoice outcome is `accepted`', (done) => {
        const event = mockEvent({
            outcome: 'accepted'
        })

        const expectedActions = [sendA2HSUserPromptAnalytics(), actions.setStatus(constants.HIDDEN)]

        store
            .dispatch(actions.promptEvent(event))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
            .then(done)
    })

    test('will also dispatch `setStatus(INACTIVE)` if the userChoice outcome is `declined`', (done) => {
        const event = mockEvent({
            outcome: 'declined'
        })

        const expectedActions = [
            sendA2HSUserPromptAnalytics(),
            actions.setStatus(constants.INACTIVE)
        ]

        store
            .dispatch(actions.promptEvent(event))
            .then(() => {
                expect(store.getActions()).toEqual(expectedActions)
            })
            .then(done)
    })
})
