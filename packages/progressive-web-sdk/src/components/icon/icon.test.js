/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import {IconWithoutUniqueId as Icon} from './index.jsx'

/* eslint-disable newline-per-chained-call */

test('Icon renders without errors', () => {
    const wrapper = mount(<Icon name="cart-add" title="Add to Cart" />)
    expect(wrapper.length).toBe(1)
})

test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Icon name="test" />)

    expect(wrapper.hasClass('pw-icon')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Icon name="test" />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Icon name="test" className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})
