/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import Banner from './index.jsx'

test('Banner renders without errors', () => {
    const wrapper = mount(<Banner />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Banner />)

    expect(wrapper.hasClass('pw-banner')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Banner />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Banner className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('has "pw--alert" class when isAlert is true', () => {
    const wrapper = shallow(<Banner isAlert />)

    expect(wrapper.hasClass('pw--alert')).toBe(true)
})
