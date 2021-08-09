/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import sinon from 'sinon'
import reducer, {initialState} from './reducer'
import * as actions from './actions'
import {getCurrentUrl} from './selectors'

/* eslint-disable newline-per-chained-call */

const sandbox = sinon.sandbox.create()

afterEach(() => {
    sandbox.restore()
})

test('unknown action type leaves state unchanged', () => {
    const action = {
        type: 'qwertyuiop'
    }
    expect(reducer(initialState, action)).toEqual(initialState)
})

test('onRouteChanged changes the current URL', () => {
    const testURL = 'https://test.mobify.com/'
    const action = actions.onRouteChanged(testURL, 'home')

    const routeChangedState = {app: reducer(initialState, action)}

    expect(getCurrentUrl(routeChangedState)).toBe(testURL)
})

test('setIsServerSideOrHydratingFlag updates the isServerSideOrHydrating flag and window.Progressive', () => {
    const currentValue = initialState.isServerSideOrHydrating
    window.Progressive = {
        isServerSideOrHydrating: currentValue
    }
    const expectedValue = !!currentValue
    const action = actions.setIsServerSideOrHydratingFlag(expectedValue)
    const newValue = reducer(initialState, action).get('isServerSideOrHydrating')
    expect(newValue).toBe(expectedValue)
    expect(window.Progressive.isServerSideOrHydrating).toBe(expectedValue)
})

test('setIsServerSideFlag updates the isServerSide flag and window.Progressive, and warns', () => {
    const currentValue = initialState.isServerSide
    window.Progressive = {
        isServerSide: currentValue
    }
    const expectedValue = !!currentValue

    const warn = sandbox.spy(console, 'warn')

    const action = actions.setIsServerSideFlag(expectedValue)
    const newValue = reducer(initialState, action).get('isServerSide')
    expect(newValue).toBe(expectedValue)
    expect(window.Progressive.isServerSide).toBe(expectedValue)
    expect(warn.called).toBe(true)
})

test('setViewportSizeValue updates the viewportSize value when not hydrating or server-side', () => {
    const action = actions.setViewportSizeValue('small')
    const state = initialState
    const initialValue = state.viewportSize
    window.Progressive = {
        viewportSize: initialValue
    }

    expect(reducer(state, action).get('viewportSize')).toBe('small')
    expect(window.Progressive.viewportSize).toBe('small')
})

test('setViewportSizeValue throws an error when server-side or hydrating', () => {
    const state = initialState
    const initialValue = state.viewportSize
    window.Progressive = {
        viewportSize: initialValue
    }

    const hydratingAction = actions.setIsServerSideOrHydratingFlag(true)
    const hydratingState = reducer(state, hydratingAction)

    const viewportAction = actions.setViewportSizeValue('small')
    expect(() => {
        reducer(hydratingState, viewportAction)
    }).toThrow()
})
