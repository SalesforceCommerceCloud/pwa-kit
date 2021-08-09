/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {shallow} from 'enzyme'
import PWAApp from './index'

describe('PWA App', () => {
    test('Renders correctly', () => {
        const body = <p>Hello world</p>
        const wrapper = shallow(<PWAApp>{body}</PWAApp>)
        expect(wrapper.contains(body)).toBe(true)
    })
})
