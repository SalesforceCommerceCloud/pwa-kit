/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import ReviewSummary from './index.jsx'

test('ReviewSummary renders without errors', () => {
    const wrapper = mount(<ReviewSummary />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<ReviewSummary />)

    expect(wrapper.hasClass('pw-review-summary')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<ReviewSummary />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<ReviewSummary className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})
