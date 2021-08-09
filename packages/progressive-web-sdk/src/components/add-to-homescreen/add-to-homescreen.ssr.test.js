/**
 * @jest-environment node
 */

/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {render} from 'enzyme'
import React from 'react'
import Immutable from 'immutable'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import addToHomeScreenHOC from './index'

const mockStore = configureMockStore([thunk])

beforeEach(() => {
    jest.resetModules()
    jest.resetAllMocks()
    jest.clearAllMocks()
})

test('addToHomescreen higher order component renders server-side without errors', () => {
    const mockComponent = () => <p />
    const store = mockStore({
        addToHomescreen: Immutable.fromJS({
            status: addToHomeScreenHOC.HIDDEN
        })
    })
    const WrappedComponent = addToHomeScreenHOC(mockComponent)
    const bar = 'bar'

    expect(() => {
        render(<WrappedComponent foo={bar} store={store} />)
    }).not.toThrow()
})

test('addToHomescreen higher order component renders its children on server-side properly', () => {
    const mockComponent = () => (
        <div className="mock-component">
            <p className="content">Content</p>
        </div>
    )
    const store = mockStore({
        addToHomescreen: Immutable.fromJS({
            status: addToHomeScreenHOC.HIDDEN
        })
    })
    const WrappedComponent = addToHomeScreenHOC(mockComponent)
    const bar = 'bar'

    const wrapper = render(<WrappedComponent foo={bar} store={store} />)
    expect(wrapper.text()).toEqual('Content')
    expect(wrapper.attr('class')).toEqual('mock-component')
    expect(wrapper.children().attr('class')).toEqual('content')
})
