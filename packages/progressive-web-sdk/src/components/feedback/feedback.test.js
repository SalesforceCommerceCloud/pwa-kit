/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'
import Icon from '../icon'

import Feedback from './index.jsx'

test('Feedback renders without errors', () => {
    const wrapper = mount(<Feedback text="test" />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Feedback text="test" />)

    expect(wrapper.hasClass('pw-feedback')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Feedback text="test" />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Feedback className={name} text="test" />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('has "pw--error" class and warning icon when isError is true', () => {
    const wrapper = shallow(<Feedback isError text="test" />)

    expect(wrapper.hasClass('pw--error')).toBe(true)
    expect(wrapper.find(Icon).prop('name')).toBe('warning')
})

test('has "pw--success" class and check icon when isSuccess is true', () => {
    const wrapper = shallow(<Feedback isSuccess text="test" />)

    expect(wrapper.hasClass('pw--success')).toBe(true)
    expect(wrapper.find(Icon).prop('name')).toBe('check')
})

test('has "pw--block" class when isBlock is true', () => {
    const wrapper = shallow(<Feedback isBlock text="test" />)

    expect(wrapper.hasClass('pw--block')).toBe(true)
})

test('renders the given icon and text', () => {
    const wrapper = shallow(<Feedback icon="test" text="text" />)

    expect(wrapper.find(Icon).prop('name')).toBe('test')
    expect(wrapper.find('.pw-feedback__content').text()).toBe('text')
})
