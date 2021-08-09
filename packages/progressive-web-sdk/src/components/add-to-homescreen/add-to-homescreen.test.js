/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount} from 'enzyme'
import React from 'react'
import Immutable from 'immutable'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

const mockStore = configureMockStore([thunk])

beforeEach(() => {
    jest.resetModules()
    jest.resetAllMocks()
    jest.clearAllMocks()
})

describe('registerBeforeInstallPromptHandler', () => {
    test('returns a promise that resolves with an instance of `beforeinstallprompt`', () => {
        jest.doMock('../../utils/utils', () => {
            return {
                getChromeVersion: jest.fn(() => 68) // eslint-disable-line
            }
        })

        const registerBeforeInstallPromptHandler = require('./index.jsx')
            .registerBeforeInstallPromptHandler

        const event = new Event('beforeinstallprompt')

        const assertionPromise = registerBeforeInstallPromptHandler().then((result) => {
            expect(result).toBe(event)
        })

        window.dispatchEvent(event)

        return assertionPromise
    })
})

describe('addToHomescreen higher order component', () => {
    let store
    let lastProps
    let addToHomescreen

    const mockComponent = (p) => {
        lastProps = p
        return <p />
    }

    beforeEach(() => {
        jest.doMock('../../utils/utils', () => {
            return {
                getChromeVersion: jest.fn(() => 68) // eslint-disable-line
            }
        })

        addToHomescreen = require('./index.jsx').default

        store = mockStore({
            addToHomescreen: Immutable.fromJS({
                status: addToHomescreen.HIDDEN
            })
        })
    })

    test('The component wrapped by the HOC takes `status`, `prompt`, and other arbitrary props', () => {
        const WrappedComponent = addToHomescreen(mockComponent)
        const bar = 'bar'

        mount(<WrappedComponent foo={bar} store={store} />)

        expect(lastProps.foo).toBe(bar)
        expect(lastProps.status).toBe(addToHomescreen.HIDDEN)
        expect(typeof lastProps.prompt).toBe('function')
    })

    test('The `prompt` prop should be a function, and should not throw when called', () => {
        const WrappedComponent = addToHomescreen(mockComponent)

        mount(<WrappedComponent store={store} />)

        expect(typeof lastProps.prompt).toBe('function')

        lastProps.prompt()
        // No further assertions made because side effects are tested in actions
    })
})
