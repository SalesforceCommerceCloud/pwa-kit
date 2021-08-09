/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow, mount} from 'enzyme'
import React from 'react'

import Button from './index'
import Link from '../link'
import Icon from '../icon'

/* eslint-disable newline-per-chained-call */

test('Button renders without errors', () => {
    const wrapper = mount(<Button />)
    expect(wrapper.length).toBe(1)
})

test('returns a link if the href prop is passed', () => {
    const wrapper = shallow(<Button href="http://test.com">Test</Button>)

    const links = wrapper.find(Link)
    expect(links.length).toBe(1)

    const link = links.first()
    expect(link.prop('href')).toBe('http://test.com')
    expect(link.childAt(0).text()).toBe('Test')
})

test('returns a button if the href prop is not passed', () => {
    const wrapper = shallow(<Button name="test" />)

    const buttons = wrapper.find('button')
    expect(buttons.length).toBe(1)

    const button = buttons.first()
    expect(button.prop('name')).toBe('test')
})

test('Button renders with inner container', () => {
    const wrapper = mount(<Button />)

    expect(wrapper.find('.pw-button__inner').length).toBe(1)
})

test('includes its children as the children of the button', () => {
    const wrapper = shallow(
        <Button>
            <div className="test">Test</div>
        </Button>
    )

    expect(wrapper.contains(<div className="test">Test</div>)).toBe(true)
})

test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Button />)

    expect(wrapper.hasClass('pw-button')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Button />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Button className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('renders the contents of the innerClassName prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Button innerClassName={name} />)

        expect(wrapper.find('.pw-button__inner').hasClass(name)).toBe(true)
    })
})

test('renders an icon if the icon prop is passed', () => {
    const wrapper = shallow(<Button icon="cart" />)

    expect(wrapper.find(Icon).length).toBe(1)
    expect(wrapper.find(Icon).prop('name')).toBe('cart')
})

test('renders an icon and a hidden title if the icon and title props are passed', () => {
    const title = 'Shopping Cart'
    const wrapper = shallow(<Button icon="cart" title={title} />)

    expect(wrapper.find(Icon).length).toBe(1)
    expect(wrapper.find('span').length).toBe(1)
    expect(
        wrapper
            .find('span')
            .first()
            .hasClass('u-visually-hidden')
    ).toBe(true)
    expect(
        wrapper
            .find('span')
            .first()
            .text()
    ).toBe(title)
})

test('renders a visible title if the icon and title props are passed with showIconText set to true', () => {
    const title = 'Shopping Cart'
    const wrapper = shallow(<Button icon="cart" title={title} showIconText={true} />)

    expect(
        wrapper
            .find('span')
            .first()
            .hasClass('pw-button__text')
    ).toBe(true)
    expect(
        wrapper
            .find('span')
            .first()
            .text()
    ).toBe(title)
})

test('renders a string child whole when an icon is passed', () => {
    const wrapper = shallow(<Button icon="x">Child String</Button>)

    const inner = wrapper.find('.pw-button__inner')
    expect(inner.children().length).toBe(2)
    expect(inner.childAt(0).type()).toBe(Icon)
    expect(inner.childAt(1).text()).toBe('Child String')
})

test('renders its children alongside the icon', () => {
    const wrapper = shallow(
        <Button icon="x">
            <hr />
            <hr />
        </Button>
    )

    const inner = wrapper.find('.pw-button__inner')
    expect(inner.children().length).toBe(3)
    expect(inner.children().map((child) => child.type())).toEqual([Icon, 'hr', 'hr'])
})

test('adds aria attributes', () => {
    const wrapper = shallow(<Button role="radio" aria-checked={true} />)
    const rawButtonProps = wrapper.find('button').props()
    expect(rawButtonProps['aria-checked']).toBe(true)
})

test('onMouseEnter fires on hover', () => {
    const mockOnMouseEnter = jest.fn()

    const wrapper = shallow(<Button onMouseEnter={mockOnMouseEnter} />)

    wrapper.simulate('mouseEnter')

    expect(mockOnMouseEnter.mock.calls.length).toBe(1)
})
