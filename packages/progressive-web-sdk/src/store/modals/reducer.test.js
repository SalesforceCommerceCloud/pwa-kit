/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */

import Immutable from 'immutable'
import modalReducer from './reducer'
import {
    openModal,
    closeModal,
    closeAllModals,
    openPersistentModal,
    persistModal,
    preRenderModal
} from './actions'
import {onRouteChanged} from '../app/actions'

const OPENED_MODAL = 'already-opened'
const CLOSED_MODAL = 'already-closed'
const TEST_MODAL = 'test-modal'
const PERSISTENT_MODAL = 'persistent-modal'

test('openModal opens a modal', () => {
    const initialState = Immutable.fromJS({
        [OPENED_MODAL]: {open: true},
        [CLOSED_MODAL]: {open: false}
    })

    const action = openModal(TEST_MODAL)

    const finalState = modalReducer(initialState, action)

    expect(finalState.getIn([OPENED_MODAL, 'open'])).toBeTruthy()
    expect(finalState.getIn([CLOSED_MODAL, 'open'])).toBeFalsy()
    expect(finalState.getIn([TEST_MODAL, 'open'])).toBeTruthy()
})

test('closeModal closes a modal', () => {
    const initialState = Immutable.fromJS({
        [OPENED_MODAL]: {open: true},
        [CLOSED_MODAL]: {open: false},
        [TEST_MODAL]: {open: true}
    })

    const action = closeModal(TEST_MODAL)

    const finalState = modalReducer(initialState, action)

    expect(finalState.getIn([OPENED_MODAL, 'open'])).toBeTruthy()
    expect(finalState.getIn([CLOSED_MODAL, 'open'])).toBeFalsy()
    expect(finalState.getIn([TEST_MODAL, 'open'])).toBeFalsy()
})

test('closeAllModals closes all modals', () => {
    // Start with a blank state
    const initialState = Immutable.fromJS({})

    // Open a few modals
    const action1 = openModal(OPENED_MODAL)
    const action2 = openModal(CLOSED_MODAL)
    const action3 = openModal(TEST_MODAL)
    const action4 = openPersistentModal(PERSISTENT_MODAL)
    const state1 = modalReducer(initialState, action1)
    const state2 = modalReducer(state1, action2)
    const state3 = modalReducer(state2, action3)
    const state4 = modalReducer(state3, action4)

    // All modals should be OPEN (despite these test modal names)
    expect(state4.getIn([OPENED_MODAL, 'open'])).toBeTruthy()
    expect(state4.getIn([CLOSED_MODAL, 'open'])).toBeTruthy()
    expect(state4.getIn([TEST_MODAL, 'open'])).toBeTruthy()
    expect(state4.getIn([PERSISTENT_MODAL, 'open'])).toBeTruthy()

    // Close all modals
    const closeAllAction = closeAllModals()
    const finalState = modalReducer(state4, closeAllAction)

    // The state should NOT match the initial state, all `open` states should be
    // set to `false`
    expect(finalState).not.toBe(initialState)
    expect(finalState.getIn([OPENED_MODAL, 'open'])).toBeFalsy()
    expect(finalState.getIn([CLOSED_MODAL, 'open'])).toBeFalsy()
    expect(finalState.getIn([TEST_MODAL, 'open'])).toBeFalsy()
    expect(finalState.getIn([PERSISTENT_MODAL, 'open'])).toBeFalsy()

    // Persistence should also be disabled after being closed
    expect(finalState.getIn([PERSISTENT_MODAL, 'persistent'])).toBeFalsy()
})

test('openPersistentModal opens a modal, and sets it to be persistent', () => {
    const initialState = Immutable.fromJS({
        [OPENED_MODAL]: {open: true},
        [CLOSED_MODAL]: {open: false}
    })

    const action = openPersistentModal(TEST_MODAL)

    const finalState = modalReducer(initialState, action)

    expect(finalState.getIn([OPENED_MODAL, 'open'])).toBeTruthy()
    expect(finalState.getIn([CLOSED_MODAL, 'open'])).toBeFalsy()
    expect(finalState.getIn([TEST_MODAL, 'open'])).toBeTruthy()
    expect(finalState.getIn([TEST_MODAL, 'persistent'])).toBeTruthy()
})

test('onRouteChanged closes all modals but persistent modals', () => {
    const initialState = Immutable.fromJS({
        [OPENED_MODAL]: {open: true},
        [CLOSED_MODAL]: {open: false},
        [PERSISTENT_MODAL]: {
            open: true,
            persistent: true
        }
    })

    const action = {type: onRouteChanged}

    const finalState = modalReducer(initialState, action)

    expect(finalState.getIn([OPENED_MODAL, 'open'])).toBeFalsy()
    expect(finalState.getIn([CLOSED_MODAL, 'open'])).toBeFalsy()
    expect(finalState.getIn([PERSISTENT_MODAL, 'open'])).toBeTruthy()
})

test('persistModal sets a modal to persist', () => {
    const initialState = Immutable.fromJS({})

    // Set closed modal to persistent
    const persistAction = persistModal(CLOSED_MODAL)
    const state1 = modalReducer(initialState, persistAction)
    expect(state1.getIn([CLOSED_MODAL, 'persistent'])).toBeTruthy()

    // open the closed modal
    const openAction = openModal(CLOSED_MODAL)
    const state2 = modalReducer(state1, openAction)
    expect(state2.getIn([CLOSED_MODAL, 'persistent'])).toBeTruthy()

    // re-close the modal
    const closeAction = closeModal(CLOSED_MODAL)
    const state3 = modalReducer(state2, closeAction)
    expect(state3.getIn([CLOSED_MODAL, 'persistent'])).toBeFalsy()

    // Closing all modals should set `persistent` to false
    const closeAllAction = closeAllModals()
    const finalState = modalReducer(state3, closeAllAction)
    expect(finalState).not.toBe(initialState)
    expect(finalState.getIn([CLOSED_MODAL, 'open'])).toBeFalsy()
    expect(finalState.getIn([CLOSED_MODAL, 'persistent'])).toBeFalsy()
})

test('preRenderModal sets a modal to prerender', () => {
    const initialState = Immutable.fromJS({})

    // Set closed modal to prerender
    const preRenderAction = preRenderModal(CLOSED_MODAL)
    const state1 = modalReducer(initialState, preRenderAction)
    expect(state1.getIn([CLOSED_MODAL, 'prerender'])).toBeTruthy()

    // open the closed modal
    const openAction = openModal(CLOSED_MODAL)
    const state2 = modalReducer(state1, openAction)
    expect(state2.getIn([CLOSED_MODAL, 'prerender'])).toBeTruthy()

    // re-close the modal
    const closeAction = closeModal(CLOSED_MODAL)
    const state3 = modalReducer(state2, closeAction)
    expect(state3.getIn([CLOSED_MODAL, 'prerender'])).toBeTruthy()

    // Closing all modals should not unset prerender (it should remain true)
    const closeAllAction = closeAllModals()
    const finalState = modalReducer(state3, closeAllAction)
    expect(finalState).not.toBe(initialState)
    expect(finalState.getIn([CLOSED_MODAL, 'open'])).toBeFalsy()
    expect(finalState.getIn([CLOSED_MODAL, 'prerender'])).toBeTruthy()
})
