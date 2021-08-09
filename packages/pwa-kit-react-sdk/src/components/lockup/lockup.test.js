/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import Lockup from './index'

test('Lockup renders without errors', () => {
    const wrapper = mount(<Lockup>Test</Lockup>)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Lockup>Test</Lockup>)

    expect(wrapper.hasClass('pw-lockup')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Lockup>Test</Lockup>)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Lockup className={name}>Test</Lockup>)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('renders unlocked by default', () => {
    const wrapper = shallow(<Lockup>Test</Lockup>)

    expect(wrapper.hasClass('pw--is-locked')).toBe(false)
})

test('renders locked with a locked prop', () => {
    const wrapper = shallow(<Lockup locked>Test</Lockup>)

    expect(wrapper.hasClass('pw--is-locked')).toBe(true)
})

test('adds the styles in the state to the container div', () => {
    const testStyles = {
        height: '10px',
        overflow: 'hidden'
    }
    const wrapper = shallow(<Lockup>Test</Lockup>)
    wrapper.setState({style: testStyles})
    expect(wrapper.prop('style')).toEqual(testStyles)
})

test('locks when the locked prop is updated to true', () => {
    const wrapper = mount(<Lockup>Test</Lockup>)

    expect(wrapper.find('.pw-lockup').hasClass('pw--is-locked')).toBe(false)
    expect(wrapper.state('style')).toBe(undefined)

    wrapper.setProps({locked: true})

    expect(wrapper.find('.pw-lockup').hasClass('pw--is-locked')).toBe(true)
    expect(wrapper.state('style').position).toBe('fixed')
    expect(wrapper.state('style').top).toBe(window.scrollY * -1)
})

test('unlocks when the locked prop is updated to false', () => {
    const wrapper = mount(<Lockup locked>Test</Lockup>)

    expect(wrapper.find('.pw-lockup').hasClass('pw--is-locked')).toBe(true)
    expect(wrapper.state('style').position).toBe('fixed')
    expect(wrapper.state('style').top).toBe(window.scrollY * -1)

    wrapper.setProps({locked: false})

    expect(wrapper.find('.pw-lockup').hasClass('pw--is-locked')).toBe(false)
    expect(wrapper.state('style').position).toBe(undefined)
    expect(wrapper.state('style').top).toBe(undefined)
})

describe('When running on iOS', () => {
    let wrapper
    let instance

    beforeEach(() => {
        wrapper = mount(<Lockup>Test</Lockup>)
        instance = wrapper.instance()
        instance.isIOS = true

        // Reset document styles
        document.body.style.removeProperty('marginTop')
        document.body.style.removeProperty('marginBottom')
    })

    test('locks differently', () => {
        wrapper.setProps({locked: true})

        expect(wrapper.find('.pw-lockup').hasClass('pw--is-locked')).toBe(true)
        expect(wrapper.state('style').position).toBe('relative')
        expect(instance.container.scrollTop).toBe(window.scrollY)
    })

    test("resets body's vertical margin when unlocked", () => {
        wrapper.setProps({locked: true})
        wrapper.setProps({locked: false})

        expect(instance.body.style.marginTop).toBe('0px')
        expect(instance.body.style.marginBottom).toBe('0px')
    })
})
