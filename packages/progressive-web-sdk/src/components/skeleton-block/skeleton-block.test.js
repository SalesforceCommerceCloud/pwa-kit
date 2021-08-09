/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow, mount} from 'enzyme'
import React from 'react'

import SkeletonBlock from './index.jsx'

const skeletonBlockClass = '.pw-skeleton-block'

test('SkeletonBlock renders without errors', () => {
    const wrapper = mount(<SkeletonBlock />)
    expect(wrapper.length).toBe(1)
})

test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<SkeletonBlock />)
    expect(wrapper.find(skeletonBlockClass).length).toBe(1)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<SkeletonBlock />)
    expect(wrapper.find(skeletonBlockClass).hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<SkeletonBlock className={name} />)

        expect(wrapper.find(skeletonBlockClass).hasClass(name)).toBe(true)
    })
})

test('SkeletonBlock renders with correct height', () => {
    const wrapper = shallow(<SkeletonBlock height="100px" />)
    expect(wrapper.find(skeletonBlockClass).prop('style').height).toBe('100px')
})

test('SkeletonBlock renders with correct custom styles', () => {
    const wrapper = shallow(<SkeletonBlock height="100px" style={{borderRadius: '100%'}} />)
    expect(wrapper.find(skeletonBlockClass).prop('style').borderRadius).toBe('100%')
})

test('SkeletonBlock renders with correct element', () => {
    const wrapper = shallow(<SkeletonBlock type="h1" />)
    expect(wrapper.find(skeletonBlockClass).is('h1')).toBe(true)
})
