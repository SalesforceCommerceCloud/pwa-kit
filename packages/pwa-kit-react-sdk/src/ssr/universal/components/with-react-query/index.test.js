/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {withReactQuery} from './index'
import {shallow} from 'enzyme'
import React from 'react'

describe('withReactQuery', function() {
    test('Renders correctly', () => {
        const Wrapped = () => <p>Hello world</p>
        const Component = withReactQuery(Wrapped)
        const wrapper = shallow(<Component locals={{}} />)
        expect(wrapper.html()).toContain('Hello world')
    })

    test(`Has working getInitializers method`, () => {
        expect(withReactQuery({}).getInitializers().length).toBe(1)
        expect(withReactQuery({getInitializers: () => ['xyz']}).getInitializers().length).toBe(2)
    })

    test(`Has working getHOCsInUse method`, () => {
        expect(withReactQuery({}).getHOCsInUse().length).toBe(1)
        expect(withReactQuery({getHOCsInUse: () => ['xyz']}).getHOCsInUse().length).toBe(2)
    })
})
