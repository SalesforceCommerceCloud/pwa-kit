/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import Price from './index.jsx'

test('Price renders without errors', () => {
    const wrapper = mount(<Price current="1" />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Price current="1" />)

    expect(wrapper.hasClass('pw-price')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Price current="1" />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Price current="1" className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('has "pw--stack" class when isStacked is true', () => {
    const wrapper = shallow(<Price current="1" isStacked />)

    expect(wrapper.hasClass('pw--stack')).toBe(true)
})

test('currentClass has "pw--reduced" class when previous is true', () => {
    const wrapper = shallow(<Price current="1" previous="2" />)
    const currentClass = wrapper.find('.pw-price__current')

    expect(currentClass.hasClass('pw--reduced')).toBe(true)
})
