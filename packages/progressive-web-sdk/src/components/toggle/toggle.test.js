/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

jest.mock('lodash.throttle')
import throttle from 'lodash.throttle'
throttle.mockImplementation((fn) => fn)

import Toggle from './index.jsx'

test('Toggle renders without errors', () => {
    const wrapper = mount(<Toggle>test</Toggle>)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Toggle>test</Toggle>)

    expect(wrapper.hasClass('pw-toggle')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Toggle>test</Toggle>)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Toggle className={name}>test</Toggle>)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('clicking on the toggle button sets expanded flag', () => {
    const wrapper = mount(
        <Toggle>
            <div style={{height: 300}}>Lorem ipsum dolor sit amet</div>
        </Toggle>
    )
    wrapper.setState({overflowing: true})
    wrapper.find('Button.pw-toggle__toggler').simulate('click')
    expect(wrapper.state('expanded')).toBe(true)
})

test('clicking on the toggle button when expanded clears expanded flag', () => {
    const wrapper = mount(
        <Toggle>
            <div style={{height: 300}}>Lorem ipsum dolor sit amet</div>
        </Toggle>
    )

    wrapper.setState({expanded: true})

    wrapper.find('Button.pw-toggle__toggler').simulate('click')
    expect(wrapper.state('expanded')).toBe(false)
})

test('toggle button has the correct default label', () => {
    const wrapper = mount(
        <Toggle>
            <div style={{height: 300}}>Lorem ipsum dolor sit amet</div>
        </Toggle>
    )
    wrapper.setState({overflowing: true})
    expect(wrapper.find('Button.pw-toggle__toggler').text()).toBe('View More')
})

test('clicking on the toggle button changes the default label', () => {
    const wrapper = mount(
        <Toggle>
            <div style={{height: 300}}>Lorem ipsum dolor sit amet</div>
        </Toggle>
    )
    wrapper.setState({overflowing: true})
    wrapper.find('Button.pw-toggle__toggler').simulate('click')
    expect(wrapper.find('Button.pw-toggle__toggler').text()).toBe('View Less')
})

test('button has the right custom label ', () => {
    const label = 'more'
    const wrapper = mount(
        <Toggle expandLabel={label}>
            <div style={{height: 300}}>Lorem ipsum dolor sit amet</div>
        </Toggle>
    )
    wrapper.setState({overflowing: true})
    expect(wrapper.find('Button.pw-toggle__toggler').text()).toBe(label)
})

test('button has the right custom label after clicking on the toggle button ', () => {
    const label = 'less'
    const wrapper = mount(
        <Toggle collapseLabel={label}>
            <div style={{height: 300}}>Lorem ipsum dolor sit amet</div>
        </Toggle>
    )
    wrapper.setState({overflowing: true})
    wrapper.find('Button.pw-toggle__toggler').simulate('click')
    expect(wrapper.find('Button.pw-toggle__toggler').text()).toBe(label)
})

describe('Event listeners', () => {
    const addEventListener = window.addEventListener
    const removeEventListener = window.removeEventListener

    beforeEach(() => {
        window.addEventListener = jest.fn(addEventListener)
        window.removeEventListener = jest.fn(removeEventListener)
    })

    afterEach(() => {
        window.addEventListener = addEventListener
        window.removeEventListener = removeEventListener
    })

    test('registers a resize listener', () => {
        const wrapper = mount(<Toggle>Test</Toggle>)
        expect(window.addEventListener).toHaveBeenCalledWith(
            'resize',
            wrapper.instance().checkContentHeight
        )
    })

    test('removes the resize listener on unmount', () => {
        const wrapper = mount(<Toggle>Test</Toggle>)
        const handler = wrapper.instance().checkContentHeight

        wrapper.unmount()
        expect(window.removeEventListener).toHaveBeenCalledWith('resize', handler)
    })
})

test('checkContentHeight sets the new content height to the state', () => {
    const wrapper = mount(<Toggle>Test</Toggle>)
    Object.defineProperty(wrapper.instance()._content, 'clientHeight', {get: () => 150})

    wrapper.instance().checkContentHeight()
    expect(wrapper.state('contentHeight')).toBe(150)
})

test('checkContentHeight sets the overflowing flag if the height is overflowing', () => {
    const wrapper = mount(<Toggle heightThreshold={100}>Test</Toggle>)
    Object.defineProperty(wrapper.instance()._content, 'clientHeight', {get: () => 150})

    wrapper.instance().checkContentHeight()
    expect(wrapper.state('overflowing')).toBe(true)
})

test('checkContentHeight clears the overflowing flag if the height is not overflowing', () => {
    const wrapper = mount(<Toggle heightThreshold={100}>Test</Toggle>)
    Object.defineProperty(wrapper.instance()._content, 'clientHeight', {get: () => 50})

    wrapper.instance().checkContentHeight()
    expect(wrapper.state('overflowing')).toBe(false)
})

test('removeMaxHeight clears the overflowing flag if the Toggle is expanded', () => {
    const wrapper = mount(<Toggle>Test</Toggle>)
    wrapper.setState({expanded: true, overflowing: true})

    wrapper.instance().removeMaxHeight({
        target: wrapper.instance()._inner
    })
    expect(wrapper.state('overflowing')).toBe(false)
})

test("removeMaxHeight does nothing if the event target doesn't match", () => {
    const wrapper = mount(<Toggle>Test</Toggle>)
    wrapper.setState({expanded: true, overflowing: true})

    wrapper.instance().removeMaxHeight({
        target: null
    })
    expect(wrapper.state('overflowing')).toBe(true)
})
