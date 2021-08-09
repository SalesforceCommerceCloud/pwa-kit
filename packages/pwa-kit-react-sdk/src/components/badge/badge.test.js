/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import Badge from './index.jsx'

test('Badge renders without errors', () => {
    const wrapper = mount(<Badge title="test" />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Badge title="test" />)

    expect(wrapper.hasClass('pw-badge')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Badge title="test" />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Badge className={name} title="test" />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('renders the contents of the title prop if present', () => {
    ;['test', 'test another'].forEach((title) => {
        const wrapper = shallow(<Badge title={title} />)

        expect(wrapper.find('.u-visually-hidden').length).toBe(1)
        expect(wrapper.find('.u-visually-hidden').text()).toBe(title)
    })
})

test('renders the contents of the children prop if present', () => {
    ;['test', 'test another'].forEach((text) => {
        const content = <span className="x-test">{text}</span>
        const wrapper = shallow(<Badge title="">{content}</Badge>)

        expect(wrapper.find('.x-test').length).toBe(1)
        expect(wrapper.find('.x-test').text()).toBe(text)
    })
})
