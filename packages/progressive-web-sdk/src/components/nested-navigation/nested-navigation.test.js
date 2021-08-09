/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import NestedNavigation from './index.jsx'

test('NestedNavigation renders without errors', () => {
    const wrapper = mount(<NestedNavigation />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<NestedNavigation />)

    expect(wrapper.hasClass('c-nested-navigation')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<NestedNavigation />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})
