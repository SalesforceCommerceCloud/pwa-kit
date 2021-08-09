/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Immutable from 'immutable'
import reducer from './reducer'
import * as actions from './actions'
import * as constants from './constants'

beforeEach(() => {
    jest.resetModules()
    jest.resetAllMocks()
    jest.clearAllMocks()
})

describe('initialState', () => {
    test('in unsupported browsers, the initial status is UNSUPPORTED', () => {
        jest.doMock('../../utils/utils', () => {
            return {
                isChrome68OrHigher: jest.fn(() => false), // eslint-disable-line
                runningServerSide: () => false
            }
        })
        const initialState = require('./reducer').initialState

        const targetState = Immutable.fromJS({
            status: constants.UNSUPPORTED
        })

        expect(initialState.equals(targetState)).toBe(true)
    })

    test('in supported browsers, the initial status is HIDDEN', () => {
        jest.doMock('../../utils/utils', () => {
            return {
                isChrome68OrHigher: jest.fn(() => true), // eslint-disable-line
                runningServerSide: () => false
            }
        })
        const initialState = require('./reducer').initialState

        const targetState = Immutable.fromJS({
            status: constants.HIDDEN
        })

        expect(initialState.equals(targetState)).toBe(true)
    })
})

test('unknown action type leaves state unchanged', () => {
    const initialState = require('./reducer').initialState

    const action = {
        type: 'qwertyuiop'
    }
    expect(reducer(initialState, action)).toBe(initialState)
})

test('setStatus sets values of status', () => {
    const initialState = require('./reducer').initialState

    const status = constants.ACTIVE
    const targetState = Immutable.fromJS({status})
    const action = actions.setStatus(status)

    expect(reducer(initialState, action).equals(targetState)).toBe(true)
})
