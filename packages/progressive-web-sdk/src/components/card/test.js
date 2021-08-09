/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
/* eslint-env jest */
import React from 'react'

import Card from './index.jsx'

test('Card renders without errors', () => {
    const wrapper = mount(<Card />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Card />)

    expect(wrapper.hasClass('pw-card')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Card />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Card className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('renders header and footer when provided', () => {
    const header = <div className="testHeader" />
    const footer = <div className="testFooter" />
    const wrapper = shallow(<Card header={header} footer={footer} />)

    expect(wrapper.find('.testHeader').length).toBe(1)
    expect(wrapper.find('.testFooter').length).toBe(1)
})
