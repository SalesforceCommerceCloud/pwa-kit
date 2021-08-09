/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import Link from '../link'
import ListTile from './index'

/* eslint-disable newline-per-chained-call */

test('ListTile renders without errors', () => {
    const wrapper = mount(<ListTile />)
    expect(wrapper.length).toBe(1)
})

test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<ListTile />)

    expect(wrapper.hasClass('pw-list-tile')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<ListTile />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<ListTile className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('renders a Link as primary if an href is present', () => {
    const wrapper = mount(<ListTile href="/mens-handbags" />)

    expect(wrapper.find(Link).length).toBe(1)
    expect(
        wrapper
            .find(Link)
            .find('a')
            .hasClass('pw-list-tile__primary')
    ).toBe(true)
    expect(wrapper.find(Link).prop('href')).toBe('/mens-handbags')
})

test('does not render a link as primary if no href is present', () => {
    const wrapper = mount(<ListTile />)

    const primary = wrapper.find('.pw-list-tile__primary')
    expect(primary.length).toBe(1)
    expect(primary.type()).toBe('div')
    expect(primary.prop('role')).toBe('button')
})

test('renders the StartAction in the primary container', () => {
    const startAction = <div className="test">Start Action</div>
    const wrapper = mount(<ListTile startAction={startAction} />)

    const start = wrapper.find('.pw-list-tile__primary .test')
    expect(start.length).toBe(1)
    expect(start.text()).toBe('Start Action')
})

test('includeEndActionInPrimary={false} moves endAction to the primary container', () => {
    const wrapper = mount(
        <ListTile
            includeEndActionInPrimary={false}
            endAction={<div className="end-action">End Action Test</div>}
        />
    )

    expect(wrapper.find('.pw-list-tile__primary .end-action').length).toBe(0)
})

test('endAction is in the primary container if includeEndActionInPrimary={false} is not set', () => {
    const wrapper = mount(
        <ListTile endAction={<div className="end-action">End Action Test</div>} />
    )

    expect(wrapper.find('.pw-list-tile__primary .end-action').length).toBe(1)
})

test('onMouseEnter fires on hover', () => {
    const mockOnMouseEnter = jest.fn()

    const wrapper = mount(<ListTile onMouseEnter={mockOnMouseEnter} />)
    wrapper.find('.pw-list-tile__primary').simulate('mouseEnter')

    expect(mockOnMouseEnter.mock.calls.length).toBe(1)
})
