/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow, mount} from 'enzyme'
import React from 'react'

import SkeletonText from './index.jsx'

const skeletonTextClass = '.pw-skeleton-text'
const skeletonTextLineClass = '.pw-skeleton-text__line'

test('SkeletonText renders without errors', () => {
    const wrapper = mount(<SkeletonText />)
    expect(wrapper.length).toBe(1)
})

test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<SkeletonText />)
    expect(wrapper.find(skeletonTextClass).length).toBe(1)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<SkeletonText />)
    expect(wrapper.find(skeletonTextClass).hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<SkeletonText className={name} />)

        expect(wrapper.find(skeletonTextClass).hasClass(name)).toBe(true)
    })
})

test('SkeletonText renders with correct default text lines', () => {
    const wrapper = shallow(<SkeletonText />)
    expect(wrapper.find(skeletonTextLineClass).length).toBe(1)
})

test('SkeletonText renders with correct custom text lines', () => {
    const wrapper = shallow(<SkeletonText lines={4} />)
    expect(wrapper.find(skeletonTextLineClass).length).toBe(4)
})

test('SkeletonText renders with correct element', () => {
    const wrapper = shallow(<SkeletonText type="h1" />)
    expect(wrapper.find(skeletonTextClass).type()).toBe('h1')
})
