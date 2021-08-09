/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {shallow} from 'enzyme'
import AMPDocument from './index'

describe('AMP Document', () => {
    test('Renders correctly', () => {
        const style = <link key="stylesheet" rel="stylesheet" href="style.css" />
        const script = <script key="script" src="script.js" />
        const html = '<p>Hello world</p>'
        const wrapper = shallow(<AMPDocument head={[style]} html={html} beforeBodyEnd={[script]} />)
        expect(wrapper.contains(style)).toBe(true)
        expect(wrapper.contains(script)).toBe(true)
        expect(wrapper.html().includes(html)).toBe(true)
    })
})
