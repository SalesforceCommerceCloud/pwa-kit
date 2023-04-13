/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {withReactQuery} from './index'
import {shallow} from 'enzyme'
import React from 'react'

describe('withReactQuery', function () {
    let windowSpy

    beforeEach(() => {
        windowSpy = jest.spyOn(window, 'window', 'get')
        jest.spyOn(console, 'warn').mockImplementation(jest.fn())
    })

    afterEach(() => {
        console.warn.mockRestore()
        windowSpy.mockRestore()
    })

    test('Renders correctly', () => {
        const Wrapped = () => <p>Hello world</p>
        const Component = withReactQuery(Wrapped)
        const wrapper = shallow(<Component locals={{}} />)
        expect(wrapper.html()).toContain('Hello world')
    })

    test(`Has working getInitializers method`, () => {
        expect(withReactQuery({}).getInitializers()).toHaveLength(1)
        expect(withReactQuery({getInitializers: () => ['xyz']}).getInitializers()).toHaveLength(2)
    })

    test(`Has working getHOCsInUse method`, () => {
        expect(withReactQuery({}).getHOCsInUse()).toHaveLength(1)
        expect(withReactQuery({getHOCsInUse: () => ['xyz']}).getHOCsInUse()).toHaveLength(2)
    })
})
