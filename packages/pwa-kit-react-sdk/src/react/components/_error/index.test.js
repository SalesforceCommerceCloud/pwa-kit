/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {mount} from 'enzyme'
import Error from './index'

describe('Error Page', () => {
    const stack = 'Error Stack'
    const status = 500
    const message = 'Error message'

    test('Renders correctly', () => {
        const wrapper = mount(<Error message={message} stack={stack} status={status} />)

        expect(wrapper.props().message).toBe(message)
        expect(wrapper.props().stack).toBe(stack)
        expect(wrapper.props().status).toBe(status)
    })

    test('Ensure that status type is a number', () => {
        const wrapper = mount(<Error message={message} status={status} />)

        expect(typeof wrapper.props().status).toBe('number')
    })
})
