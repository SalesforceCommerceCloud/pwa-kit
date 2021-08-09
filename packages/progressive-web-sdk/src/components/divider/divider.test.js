/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import Divider from './index.jsx'

test('Divider renders without errors', () => {
    const wrapper = mount(<Divider />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Divider />)

    expect(wrapper.hasClass('pw-divider')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Divider />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Divider className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('includes its label when provided', () => {
    const wrapper = shallow(<Divider label="Test" />)
    const text = wrapper.find('.pw-divider__text')

    expect(text.length).toBe(1)
    expect(text.text()).toBe('Test')
    expect(wrapper.hasClass('pw--no-label')).toBe(false)
})

test('does not render a label when none provided', () => {
    const wrapper = shallow(<Divider />)

    expect(wrapper.find('.pw-divider__text').length).toBe(0)
    expect(wrapper.hasClass('pw--no-label')).toBe(true)
})
