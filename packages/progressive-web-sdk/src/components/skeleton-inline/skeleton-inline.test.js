/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow, mount} from 'enzyme'
import React from 'react'

import SkeletonInline from './index.jsx'

const skeletonInlineClass = '.pw-skeleton-inline'

test('SkeletonInline renders without errors', () => {
    const wrapper = mount(<SkeletonInline />)
    expect(wrapper.length).toBe(1)
})

test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<SkeletonInline />)
    expect(wrapper.find(skeletonInlineClass).length).toBe(1)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<SkeletonInline />)
    expect(wrapper.find(skeletonInlineClass).hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<SkeletonInline className={name} />)

        expect(wrapper.find(skeletonInlineClass).hasClass(name)).toBe(true)
    })
})

test('SkeletonInline renders with correct font size', () => {
    const wrapper = shallow(<SkeletonInline size="16px" />)
    expect(wrapper.find(skeletonInlineClass).prop('style').fontSize).toBe('16px')
})

test('SkeletonInline renders with correct width', () => {
    const wrapper = shallow(<SkeletonInline width="25%" />)
    expect(wrapper.find(skeletonInlineClass).prop('style').width).toBe('25%')
})

test('SkeletonInline renders with correct custom styles', () => {
    const wrapper = shallow(<SkeletonInline style={{color: 'darksalmon'}} />)
    expect(wrapper.find(skeletonInlineClass).prop('style').color).toBe('darksalmon')
})

test('SkeletonInline renders with correct element', () => {
    const wrapper = shallow(<SkeletonInline type="h1" />)
    expect(wrapper.find(skeletonInlineClass).type()).toBe('h1')
})

test('SkeletonInline renders with correct href if element type is anchor', () => {
    const wrapper = shallow(<SkeletonInline type="a" />)
    expect(wrapper.find(skeletonInlineClass).prop('href')).toBe('#')
})
