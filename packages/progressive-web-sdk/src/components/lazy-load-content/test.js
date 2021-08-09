/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import {mount} from 'enzyme'
import React from 'react'

import LazyLoadContent from './index.jsx'

test('LazyLoadContent renders without errors', () => {
    const wrapper = mount(<LazyLoadContent>test</LazyLoadContent>)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = mount(<LazyLoadContent>test</LazyLoadContent>)

    expect(wrapper.children().hasClass('pw-lazy-load-content')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = mount(<LazyLoadContent>test</LazyLoadContent>)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = mount(<LazyLoadContent className={name}>Test</LazyLoadContent>)

        expect(wrapper.hasClass(name)).toBe(true)
    })
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
        expect(window.addEventListener).not.toHaveBeenCalled()
        const wrapper = mount(<LazyLoadContent>test</LazyLoadContent>)
        expect(window.addEventListener).toHaveBeenCalledWith(
            'scroll',
            wrapper.instance().handleScroll
        )
    })

    test('removes the resize listener on unmount if not visible', () => {
        const wrapper = mount(<LazyLoadContent threshold={1000}>test</LazyLoadContent>)
        const handler = wrapper.instance().handleScroll

        expect(window.removeEventListener).not.toHaveBeenCalledWith('scroll', handler)
        wrapper.unmount()
        expect(window.removeEventListener).toHaveBeenCalledWith('scroll', handler)
    })

    test('removes the resize listener immediately if visible', () => {
        const wrapper = mount(<LazyLoadContent>test</LazyLoadContent>)
        const handler = wrapper.instance().handleScroll

        expect(window.removeEventListener).toHaveBeenCalledWith('scroll', handler)
    })
})

describe('handleScroll', () => {
    test('calls checkVisible if not visible', () => {
        const wrapper = mount(<LazyLoadContent>test</LazyLoadContent>)
        wrapper.setState({visible: false})
        wrapper.instance().checkVisible = jest.fn()

        wrapper.instance().handleScroll()
        expect(wrapper.instance().checkVisible).toBeCalled()
    })

    test('does nothing if visible', () => {
        const wrapper = mount(<LazyLoadContent>test</LazyLoadContent>)
        wrapper.instance().checkVisible = jest.fn()

        expect(wrapper.state('visible')).toBeTruthy()
        wrapper.instance().handleScroll()
        expect(wrapper.instance().checkVisible).not.toBeCalled()
    })
})
