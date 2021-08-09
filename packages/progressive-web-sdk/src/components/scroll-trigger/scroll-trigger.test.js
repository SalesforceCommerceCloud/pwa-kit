/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
/* eslint-env jest */
import React from 'react'

import ScrollTrigger from './index.jsx'

test('ScrollTrigger renders without errors', () => {
    const wrapper = mount(<ScrollTrigger />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<ScrollTrigger />)

    expect(wrapper.hasClass('pw-scroll-trigger')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<ScrollTrigger />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<ScrollTrigger className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('calls onEnter when the component is mounted within view', () => {
    const onEnter = jest.fn()
    mount(<ScrollTrigger onEnter={onEnter} />)

    expect(onEnter).toHaveBeenCalled()
})

test('calls onEnter when the component is scrolled into view', () => {
    window.innerHeight = -1

    // We need to remove the throttling so that the function is actually called while the test is running
    const onEnter = jest.fn()
    const wrapper = mount(<ScrollTrigger onEnter={onEnter} throttle={0} />)

    expect(onEnter).not.toHaveBeenCalled()

    window.innerHeight = 1

    wrapper.instance().handleScroll()

    expect(onEnter).toHaveBeenCalled()
})

test('calls onLeave when the component is scrolled out of view', () => {
    const onLeave = jest.fn()
    const wrapper = mount(<ScrollTrigger onLeave={onLeave} throttle={0} />)

    wrapper.instance().element.getBoundingClientRect = () => {
        // At this position, the element has been scrolled out of view
        return {
            top: -1,
            bottom: -1
        }
    }

    wrapper.instance().handleScroll()

    expect(onLeave).toHaveBeenCalled()
})

test('does not call onEnter again if whether the component is in view or not has not changed', () => {
    const onEnter = jest.fn()
    const wrapper = mount(<ScrollTrigger onEnter={onEnter} throttle={0} />)

    expect(onEnter.mock.calls.length).toBe(1)

    wrapper.instance().handleScroll()

    expect(onEnter.mock.calls.length).toBe(1)
})

test('adds event listeners on mount', () => {
    const addEventListener = window.addEventListener
    window.addEventListener = jest.fn()

    expect(window.addEventListener).not.toHaveBeenCalled()
    mount(<ScrollTrigger />)
    expect(window.addEventListener).toHaveBeenCalled()

    window.addEventListener = addEventListener
})

test('removes event listeners on unmount', () => {
    const addEventListener = window.addEventListener
    const removeEventListener = window.removeEventListener

    window.addEventListener = jest.fn(addEventListener)
    window.removeEventListener = jest.fn(removeEventListener)

    const wrapper = mount(<ScrollTrigger />)
    const handler = wrapper.instance().handleScroll
    expect(window.addEventListener).toBeCalledWith('scroll', handler)
    expect(window.addEventListener).toBeCalledWith('resize', handler)

    wrapper.unmount()
    expect(window.removeEventListener).toBeCalledWith('scroll', handler)
    expect(window.removeEventListener).toBeCalledWith('resize', handler)

    window.addEventListener = addEventListener
    window.removeEventListener = removeEventListener
})

test('does not produce error when onEnter happens to unmount the component', () => {
    const consoleError = window.console.error
    window.console.error = jest.fn()

    // Making sure that when component is mounted, it'll be out of view
    window.innerHeight = -1

    // We need to remove the throttling so that the function is actually called while the test is running
    const wrapper = mount(<ScrollTrigger onEnter={() => wrapper.unmount()} throttle={0} />)

    window.innerHeight = 1
    // Now the component is in view and thus, onEnter would be triggered
    wrapper.instance().handleScroll()

    expect(window.console.error).not.toHaveBeenCalled()

    window.console.error = consoleError
})
