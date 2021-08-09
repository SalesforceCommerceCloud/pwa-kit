/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import Icon from '../icon/'
import IconLabel from './index.jsx'

test('IconLabel renders without errors', () => {
    const wrapper = mount(<IconLabel iconName="person" label="person" />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<IconLabel iconName="person" label="person" />)

    expect(wrapper.children().hasClass('pw-icon-label')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<IconLabel iconName="person" label="person" />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<IconLabel className={name} iconName="person" label="person" />)

        expect(wrapper.children().hasClass(name)).toBe(true)
    })
})

test('renders the icon and label with the correct values', () => {
    const wrapper = mount(
        <IconLabel iconName="tester" iconPrefix="test" iconSize="small" label="Label" />
    )

    expect(wrapper.find(Icon).prop('name')).toBe('tester')
    expect(wrapper.find(Icon).prop('size')).toBe('small')
    expect(wrapper.find('.pw-icon-label__label').length).toBe(1)
    expect(wrapper.find('.pw-icon-label__label').text()).toBe('Label')
    expect(
        wrapper
            .find('use')
            .html()
            .indexOf('#test-') > 0
    ).toBe(true)
})

test('renders IconLabel with button element', () => {
    const analyticsNameValue = 'analytics-name'
    const innerClassNameValue = 'inner-class-name'
    const wrapper = shallow(
        <IconLabel
            iconName="tester"
            iconSize="small"
            label="Label"
            button={{analyticsName: analyticsNameValue, buttonInnerClassName: innerClassNameValue}}
        />
    )

    expect(wrapper.find('Button').length).toBe(1)
    expect(wrapper.find('Button').prop('data-analytics-name')).toBe(analyticsNameValue)
    expect(wrapper.find('Button').prop('innerClassName')).toBe(`u-padding-0 ${innerClassNameValue}`)
})

test('If an onClick handler is passed, it is attached to the rendered component', () => {
    const onClick = jest.fn()
    const wrapper = shallow(
        <IconLabel iconName="tester" iconSize="small" label="Label" button={{onClick}} />
    )

    expect(wrapper.children().is('Button')).toBe(true)
    expect(wrapper.children().prop('onClick')).toBe(onClick)
    expect(onClick).not.toBeCalled()
    wrapper.children().simulate('click')
    expect(onClick).toBeCalled()
})
