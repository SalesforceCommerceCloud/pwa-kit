/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {shallow} from 'enzyme'
import App from './index'

describe('App', () => {
    test('Renders correctly', () => {
        const body = <p>Hello world</p>
        const wrapper = shallow(<App>{body}</App>)
        expect(wrapper.contains(body)).toBe(true)
    })
})
