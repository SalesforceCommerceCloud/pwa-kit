/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import ScrollTo from './index.jsx'

beforeEach(() => {
    document.body.scrollTop = 0
})

test('ScrollTo renders without errors', () => {
    const wrapper = mount(<ScrollTo target="/">Test</ScrollTo>)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<ScrollTo target="/">Test</ScrollTo>)

    expect(wrapper.hasClass('pw-scroll-to')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<ScrollTo target="/">Test</ScrollTo>)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(
            <ScrollTo className={name} target="/">
                Test
            </ScrollTo>
        )

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('will scroll to the specified numeric position immediately with zero duration', () => {
    const wrapper = shallow(
        <ScrollTo target={50} duration={0}>
            Test
        </ScrollTo>
    )

    wrapper.simulate('click')
    expect(document.body.scrollTop).toBe(50)
    wrapper.setProps({target: 100})
    wrapper.simulate('click')
    expect(document.body.scrollTop).toBe(100)
})

test('will not scroll if the selector matches nothing', () => {
    const wrapper = mount(
        <ScrollTo target=".nonexistent-class" duration={0}>
            Test
        </ScrollTo>
    )

    document.body.scrollTop = 100
    wrapper.simulate('click')
    expect(document.body.scrollTop).toBe(100)
})

test('will scroll to an element if the selector matches one', () => {
    // JsDOM has a stub `getBoundingClientRect` method so we can only
    // test by scrolling to 0
    const testTarget = document.createElement('div')
    testTarget.classList.add('target')
    document.body.appendChild(testTarget)
    document.body.scrollTop = 100

    const wrapper = mount(
        <ScrollTo target=".target" duration={0}>
            Test
        </ScrollTo>
    )
    wrapper.simulate('click')
    expect(document.body.scrollTop).toBe(0)
})

// Mock `requestAnimationFrame` for tests run using jsDOM
const {requestAnimationFrame, advanceAnimationFrame} = (() => {
    let callback = null
    const requestAnimationFrame = (newCallback) => {
        callback = newCallback
    }
    const advanceAnimationFrame = () => {
        if (callback) {
            const cb = callback
            callback = null
            cb()
            return true
        } else {
            return false
        }
    }
    return {requestAnimationFrame, advanceAnimationFrame}
})()

global.requestAnimationFrame = requestAnimationFrame

test('will animate if the duration is provided', () => {
    const wrapper = mount(
        <ScrollTo target={1000} duration={250}>
            Test
        </ScrollTo>
    )

    wrapper.simulate('click')
    // we expect 16 frames to be specified and each of them to scroll
    let lastPosition = -1
    for (let i = 0; i <= 15; i++) {
        expect(advanceAnimationFrame()).toBe(true)
        expect(document.body.scrollTop).not.toBe(lastPosition)
        lastPosition = document.body.scrollTop
    }
    expect(advanceAnimationFrame()).toBe(false)
    expect(document.body.scrollTop).toBe(1000)
})

test('finishes animating before focusing on the target element', (done) => {
    const testTarget = document.createElement('a')
    testTarget.classList.add('target-link')
    testTarget.focus = jest.fn()
    document.body.appendChild(testTarget)
    document.body.scrollTop = 100

    const wrapper = mount(
        <ScrollTo target=".target-link" duration={1}>
            Test
        </ScrollTo>
    )

    wrapper.simulate('click')
    expect(testTarget.focus).not.toHaveBeenCalled()

    advanceAnimationFrame()

    // We're wrapping this in a timeout because focus is called inside a promise
    // expect needs to be called async to run after the promise
    setTimeout(() => {
        expect(testTarget.focus).toHaveBeenCalled()
        done()
    })
})
