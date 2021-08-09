/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import InlineLoader from './index.jsx'

test('InlineLoader renders without errors', () => {
    const wrapper = mount(<InlineLoader />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<InlineLoader />)

    expect(wrapper.hasClass('pw-inline-loader')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<InlineLoader />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<InlineLoader className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('renders the correct number of loading dots', () => {
    const wrapper = shallow(<InlineLoader dotCount={4} />)

    expect(wrapper.find('.pw-inline-loader__loading-dot').length).toBe(4)
})

test('loading dots have correct animation delay offset', () => {
    const wrapper = shallow(<InlineLoader dotCount={4} animationDelayOffset={0.5} />)
    const animationDelay = ['0s', '0.5s', '1s', '1.5s']

    wrapper.find('.pw-inline-loader__loading-dot').forEach((dot, idx) => {
        expect(dot.prop('style').animationDelay).toBe(animationDelay[idx])
    })
})
