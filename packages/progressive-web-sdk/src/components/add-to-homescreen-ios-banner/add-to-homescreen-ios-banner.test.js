/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount} from 'enzyme'
/* eslint-env jest */
import React from 'react'

import AddToHomescreenIosBanner from '.'

test('AddToHomescreenIosBanner renders without errors', () => {
    const wrapper = mount(<AddToHomescreenIosBanner />)
    expect(wrapper.length).toBe(1)
})

test('setting inlineDisplay adds the class name', () => {
    const wrapper = mount(<AddToHomescreenIosBanner inlineDisplay />)
    expect(wrapper.childAt(0).hasClass('pw-inline-display')).toBe(true)
})

test('adding a class name will show in the component.', () => {
    const wrapper = mount(<AddToHomescreenIosBanner className="test" />)
    expect(wrapper.childAt(0).hasClass('test')).toBe(true)
})

test('clicking on close button runs the callback and closes the banner', () => {
    const mockCloseBannerCallback = jest.fn()
    const wrapper = mount(
        <AddToHomescreenIosBanner closeBannerCallback={mockCloseBannerCallback} />
    )
    wrapper.find('button').simulate('click')
    expect(mockCloseBannerCallback).toBeCalled()
    expect(wrapper.state('isClosed')).toBe(true)
})
