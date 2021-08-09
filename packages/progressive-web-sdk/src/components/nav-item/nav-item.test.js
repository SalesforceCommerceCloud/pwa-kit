/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow, mount} from 'enzyme'
import React from 'react'

import NavItem from './index.jsx'

/* eslint-disable newline-per-chained-call */

test('NavItem renders without errors', () => {
    const wrapper = mount(<NavItem />)

    expect(wrapper.length).toBe(1)
})

test('it renders a ListTile component', () => {
    const wrapper = mount(<NavItem content="title" />)

    expect(wrapper.find('ListTile').length).toBe(1)

    expect(wrapper.childAt(0).text()).toBe('title')
})

test('renders extra content correctly', () => {
    const overrideContent = <span>override content</span>
    const wrapper = mount(<NavItem beforeContent="before" content={overrideContent} />)
    const primaryWrapper = wrapper.find('.pw-list-tile__primary')

    // Check the before content
    expect(primaryWrapper.childAt(0).type()).toBe('div')
    expect(primaryWrapper.childAt(0).text()).toBe('before')

    // Check the main content
    expect(primaryWrapper.find('.pw-list-tile__content').children().length).toBe(1)
    expect(
        primaryWrapper
            .find('.pw-list-tile__content')
            .childAt(0)
            .type()
    ).toBe('span')
    expect(
        primaryWrapper
            .find('.pw-list-tile__content')
            .childAt(0)
            .text()
    ).toBe('override content')
})

test('renders a childIcon if hasChild is true', () => {
    const wrapper = mount(<NavItem hasChild childIcon=">>" />)

    expect(wrapper.find('ListTile').hasClass('pw--has-child')).toBe(true)
    expect(wrapper.find('ListTile').prop('endAction')).toBe('>>')
})

test('does not render a childIcon if hasChild is false', () => {
    const wrapper = mount(<NavItem hasChild={false} childIcon=">>" />)
    const primaryWrapper = wrapper.find('.pw-list-tile__primary')

    expect(wrapper.find('.pw-list-tile').hasClass('pw--has-child')).toBe(false)
    expect(primaryWrapper.children().length).toBe(1)
    expect(primaryWrapper.childAt(0).hasClass('pw-list-tile__content')).toBe(true)
})

test('includes the component class name with no className prop', () => {
    const wrapper = mount(<NavItem />)
    expect(wrapper.find('ListTile').hasClass('pw-nav-item')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<NavItem />)
    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    const name = 'name'
    const wrapper = mount(<NavItem className={name} />)
    expect(wrapper.find('ListTile').hasClass(name)).toBe(true)
})

test('invokes the navigate callback on click by default', () => {
    const spy = jest.fn()
    const wrapper = shallow(<NavItem content="title" navigate={spy} />)
    wrapper.find('ListTile').simulate('click', new MouseEvent('click'))
    expect(spy.mock.calls.length).toBe(1)
})
