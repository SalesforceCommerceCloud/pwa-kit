/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
/* eslint-env jest */
import React from 'react'

import PasswordInput from './index.jsx'

test('PasswordInput renders without errors', () => {
    const wrapper = mount(<PasswordInput />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<PasswordInput />)

    expect(wrapper.hasClass('pw-password-input')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<PasswordInput />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<PasswordInput className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('tapping the button toggles the password field type', () => {
    const wrapper = mount(<PasswordInput />)

    expect(wrapper.find('input').is('[type="password"]')).toBe(true)

    wrapper.find('button').simulate('click')
    expect(wrapper.find('input').is('[type="text"]')).toBe(true)

    wrapper.find('button').simulate('click')
    expect(wrapper.find('input').is('[type="password"]')).toBe(true)
})

test('toggle button has no text if hideButtonText is true', () => {
    const wrapper = mount(<PasswordInput hideButtonText />)

    // Get the inner '<button>', but not the outer '<Button>'
    const toggleButton = () => wrapper.find('button.pw-password-input__toggle')
    expect(toggleButton().text()).toBe('')
})

test('toggle button has `pw--is-text` class when hideButtonText is false ', () => {
    const wrapper = shallow(<PasswordInput />)
    expect(wrapper.find('.pw-password-input__toggle').hasClass('pw--is-text')).toBe(true)
})

test('toggle button does not have `pw--is-text` class when hideButtonText is true ', () => {
    const wrapper = shallow(<PasswordInput hideButtonText />)
    expect(wrapper.find('.pw-password-input__toggle').hasClass('pw--is-text')).toBe(false)
})

test('tapping the button toggles the text for toggle button', () => {
    const showText = 'Show Password'
    const hideText = 'Hide Password'
    const wrapper = mount(<PasswordInput />)

    // Get the inner `<button>`, but not the outer `<Button>`
    const toggleButton = () => wrapper.find('button.pw-password-input__toggle')
    expect(toggleButton().text()).toBe(showText)

    // Click the outter `<Button>`, not the inner `<button>`
    wrapper.find('Button.pw-password-input__toggle').simulate('click')
    expect(toggleButton().text()).toBe(hideText)
})
