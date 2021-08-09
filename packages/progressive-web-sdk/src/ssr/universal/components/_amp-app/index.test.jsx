/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {shallow} from 'enzyme'
import AMPApp from './index'

describe('AMPApp App', () => {
    test('Renders correctly', () => {
        const body = <p>Hello world</p>
        const wrapper = shallow(<AMPApp>{body}</AMPApp>)
        expect(wrapper.contains(body)).toBe(true)
    })
})
