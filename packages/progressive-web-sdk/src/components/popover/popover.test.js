/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow, mount} from 'enzyme'
import React from 'react'

import {UnwrappedPopover as Popover} from './index'
const MOBILE_UA =
    'Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) Chrome/18.0.1025.133 Mobile Safari/535.19'
const DESKTOP_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) Chrome/72.0.3626.121 Safari/537.36'
describe('Popover', () => {
    test('renders without errors', () => {
        const wrapper = mount(
            <Popover trigger="Trigger">
                Hello! I'm the content of a popover that has a left-aligned caret.
            </Popover>
        )
        expect(wrapper.length).toBe(1)
    })

    test('includes the component class name with no className prop', () => {
        const wrapper = shallow(
            <Popover trigger="Trigger">
                Hello! I'm the content of a popover that has a left-aligned caret.
            </Popover>
        )

        expect(wrapper.hasClass('pw-popover')).toBe(true)
    })

    test("does not render an 'undefined' class with no className", () => {
        const wrapper = shallow(
            <Popover trigger="Trigger">
                Hello! I'm the content of a popover that has a left-aligned caret.
            </Popover>
        )

        expect(wrapper.hasClass('undefined')).toBe(false)
    })

    test('renders the contents of the className prop if present', () => {
        ;['test', 'test another'].forEach((name) => {
            const wrapper = shallow(
                <Popover trigger="Trigger" className={name}>
                    Hello! I'm the content of a popover that has a left-aligned caret.
                </Popover>
            )

            expect(wrapper.hasClass(name)).toBe(true)
        })
    })

    test('renders the contents of the innerClassName prop if present', () => {
        ;['test', 'test another'].forEach((name) => {
            const wrapper = mount(
                <Popover trigger="Trigger" innerClassName={name}>
                    Hello! I'm the content of a popover that has a left-aligned caret.
                </Popover>
            )

            wrapper.setState({open: true})
            const innerContainer = wrapper.find('.pw-popover__inner')

            expect(innerContainer.hasClass(name)).toBe(true)
        })
    })

    test('renders trigger content', () => {
        const trigger = 'Trigger'
        const wrapper = mount(
            <Popover trigger={trigger}>
                Hello! I'm the content of a popover that has a left-aligned caret.
            </Popover>
        )

        const triggerContainer = wrapper.find('button')
        expect(triggerContainer.contains(trigger)).toBe(true)
    })

    test('renders trigger button with correct type', () => {
        const trigger = 'Trigger'
        const wrapper = mount(
            <Popover trigger={trigger}>
                Hello! I'm the content of a popover that has a left-aligned caret.
            </Popover>
        )

        const triggerContainer = wrapper.find('button')
        expect(triggerContainer.type()).toBe('button')
    })

    test('renders trigger button with triggerClassName', () => {
        const wrapper = mount(<Popover trigger="Test" triggerClassName={'foo-bar'} />)

        expect(wrapper.find('button.foo-bar').length).toBe(1)
    })

    test('popover state is closed by default and no content is rendered', () => {
        const wrapper = mount(
            <Popover trigger="Trigger">
                Hello! I'm the content of a popover that has a left-aligned caret.
            </Popover>
        )

        expect(wrapper.state().open).toBe(false)
        expect(wrapper.find('.pw-popover__inner').length).toBe(0)
    })

    test('button trigger toggles popover content click', () => {
        const wrapper = mount(
            <Popover trigger="Trigger" triggerType="button">
                Hello! I'm the content of a popover that has a left-aligned caret.
            </Popover>
        )

        const triggerContainer = wrapper.find('button')
        triggerContainer.simulate('click', {view: {navigator: {}}})

        expect(wrapper.state().open).toBe(true)
        expect(wrapper.find('.pw-popover__content').length).toBe(1)

        triggerContainer.simulate('click')

        expect(wrapper.state().open).toBe(false)
    })

    test('button trigger toggles popover content hover', () => {
        const wrapper = mount(
            <Popover trigger="Trigger" triggerType="button" isHover={true}>
                Hello! I'm the content of a popover that has a left-aligned caret.
            </Popover>
        )

        const triggerContainer = wrapper.find('button')
        triggerContainer.simulate('mouseEnter', {view: {navigator: {}}})

        expect(wrapper.state().open).toBe(true)
        expect(wrapper.find('.pw-popover__content').length).toBe(1)

        triggerContainer.simulate('mouseLeave')

        expect(wrapper.state().open).toBe(false)
    })

    test('input trigger toggles popover content click', () => {
        const wrapper = mount(
            <Popover
                trigger="Trigger"
                triggerElement={
                    <input
                        name="exampleInput"
                        type="text"
                        defaultValue="Hello"
                        placeholder="I am an Input"
                        required={true}
                    />
                }
            >
                Hello! I'm the content of a popover that has a left-aligned caret.
            </Popover>
        )

        const triggerContainer = wrapper.find('input')
        triggerContainer.simulate('mouseDown')

        expect(wrapper.state().open).toBe(true)
        expect(wrapper.find('.pw-popover__content').length).toBe(1)

        triggerContainer.simulate('mouseDown')

        expect(wrapper.state().open).toBe(false)
    })

    test('input trigger toggles popover content focus and blur', () => {
        const wrapper = mount(
            <Popover
                trigger="Trigger"
                triggerElement={
                    <input
                        name="exampleInput"
                        type="text"
                        defaultValue="Hello"
                        placeholder="I am an Input"
                        required={true}
                    />
                }
            >
                Hello! I'm the content of a popover that has a left-aligned caret.
            </Popover>
        )

        const triggerContainer = wrapper.find('input')
        triggerContainer.simulate('focus')

        expect(wrapper.state().open).toBe(true)
        expect(wrapper.find('.pw-popover__content').length).toBe(1)

        triggerContainer.simulate('blur')

        expect(wrapper.state().open).toBe(false)
    })

    test('test clicking isnt activated on hover desktop hover config', () => {
        const wrapper = mount(
            <Popover trigger="Trigger" isHover={true}>
                Hello! I'm the content of a popover that has a left-aligned caret.
            </Popover>
        )

        const triggerContainer = wrapper.find('button')
        triggerContainer.simulate('click', {view: {navigator: {userAgent: DESKTOP_UA}}})

        expect(wrapper.state().open).toBe(false)
        expect(wrapper.find('.pw-popover__content').length).toBe(0)
    })

    test('test hovering isnt activated on mobile', () => {
        const wrapper = mount(
            <Popover trigger="Trigger" isHover={false}>
                Hello! I'm the content of a popover that has a left-aligned caret.
            </Popover>
        )

        const triggerContainer = wrapper.find('button')
        triggerContainer.simulate('mouseEnter', {view: {navigator: {userAgent: MOBILE_UA}}})

        expect(wrapper.state().open).toBe(false)
        expect(wrapper.find('.pw-popover__content').length).toBe(0)
    })

    test('test handleClickOutside', () => {
        const wrapper = mount(
            <Popover trigger="Trigger" isHover={true}>
                Hello! I'm the content of a popover that has a left-aligned caret.
            </Popover>
        )

        const triggerContainer = wrapper.find('button')
        triggerContainer.simulate('click')

        expect(wrapper.state().open).toBe(true)
        expect(wrapper.find('.pw-popover__content').length).toBe(1)

        wrapper.instance().handleClickOutside()

        expect(wrapper.state().open).toBe(false)
    })

    test('test handleClickOutside closeOnOutsideClick false', () => {
        const wrapper = mount(
            <Popover trigger="Trigger" isHover={true} closeOnOutsideClick={false}>
                Hello! I'm the content of a popover that has a left-aligned caret.
            </Popover>
        )

        const triggerContainer = wrapper.find('button')
        triggerContainer.simulate('click')

        expect(wrapper.state().open).toBe(true)
        expect(wrapper.find('.pw-popover__content').length).toBe(1)

        wrapper.instance().handleClickOutside()

        expect(wrapper.state().open).toBe(true)
    })

    test('test isMobile userAgent true', () => {
        const wrapper = mount(
            <Popover trigger="Trigger" isHover={true}>
                Hello! I'm the content of a popover that has a left-aligned caret.
            </Popover>
        )
        expect(wrapper.instance().isMobile(MOBILE_UA)).toBe(true)
    })

    test('test isMobile userAgent false', () => {
        const wrapper = mount(
            <Popover trigger="Trigger" sHover={true}>
                Hello! I'm the content of a popover that has a left-aligned caret.
            </Popover>
        )
        expect(wrapper.instance().isMobile(DESKTOP_UA)).toBe(false)
    })
})
