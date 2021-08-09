/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import Review from './index.jsx'
import Rating from '../rating'

test('Review renders without errors', () => {
    const wrapper = mount(<Review />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Review />)

    expect(wrapper.hasClass('pw-review')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Review />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Review className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('renders a header with the title and a Rating component', () => {
    const wrapper = shallow(<Review title="Test title" />)

    const header = wrapper.find('header')
    expect(header.length).toBe(1)
    expect(header.childAt(0).text()).toBe('Test title')
    expect(header.childAt(1).type()).toBe(Rating)
})

test('renders info items if they are passed', () => {
    const info = ['First', 'Second', 'Third']
    const wrapper = shallow(<Review info={info} />)

    const infoDiv = wrapper.find('.pw-review__author')

    expect(infoDiv.length).toBe(1)
    expect(infoDiv.children().length).toBe(info.length)
    info.forEach((text, idx) => {
        expect(infoDiv.childAt(idx).text()).toBe(text)
    })
})

test('does not render info items if none are passed', () => {
    const wrapper = shallow(<Review />)

    expect(wrapper.find('.pw-review__author').length).toBe(0)
})
