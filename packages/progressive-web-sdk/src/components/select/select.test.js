/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow, mount} from 'enzyme'
import React from 'react'

import Select, {SelectOption, SelectLabel} from './index'

test('Select renders without errors', () => {
    const wrapper = mount(<Select />)
    expect(wrapper.length).toBe(1)
})

test('SelectLabel renders without errors', () => {
    const wrapper = mount(<SelectLabel />)
    expect(wrapper.length).toBe(1)
})

test('SelectOption renders an option element with the passed value and text', () => {
    const wrapper = shallow(<SelectOption value="test" text="Test!" />)

    expect(wrapper.contains(<option value="test">Test!</option>)).toBe(true)
})

test('SelectOption has the value as the default text', () => {
    const wrapper = shallow(<SelectOption value="Again" />)

    expect(wrapper.contains(<option value="Again">Again</option>)).toBe(true)
})

test('SelectLabel renders a label if text is passed', () => {
    const wrapper = shallow(<SelectLabel label="testing" />)

    const labels = wrapper.find('label')
    expect(labels.length).toBe(1)
    expect(labels.childAt(0).text()).toBe('testing')
})

test('SelectLabel renders no label if no text is passed', () => {
    const wrapper = shallow(<SelectLabel />)

    expect(wrapper.find('label').length).toBe(0)
})

test('Select renders a SelectLabel with the passed value', () => {
    ;['Label', null].forEach((label) => {
        const wrapper = shallow(<Select options={[{value: ''}]} label={label} />)

        expect(wrapper.find(SelectLabel).length).toBe(1)
        expect(wrapper.find(SelectLabel).prop('label')).toBe(label)
    })
})

test('Select renders a select element containing SelectOptions', () => {
    const wrapper = shallow(<Select options={[{value: 'test'}]} />)

    const selects = wrapper.find('select')
    expect(selects.length).toBe(1)
    expect(selects.find(SelectOption).length).toBe(1)
    expect(selects.find(SelectOption).prop('value')).toBe('test')
})

test('Select renders one SelectOption per passed option, in order', () => {
    const options = [
        {value: 'first'},
        {value: 'second', text: '2nd'},
        {value: 'third', text: 'third and last'}
    ]
    const wrapper = shallow(<Select options={options} />)

    expect(wrapper.find(SelectOption).length).toBe(options.length)
    expect(
        wrapper.find(SelectOption).reduce((soFar, node, idx) => {
            return (
                soFar &&
                node.prop('value') === options[idx].value &&
                node.prop('text') === options[idx].text
            )
        }, true)
    ).toBe(true)
})

test('Select correctly shows selected option when passed selectedIndex', () => {
    const options = [
        {value: 'first'},
        {value: 'second', text: '2nd'},
        {value: 'third', text: 'third and last'}
    ]
    const wrapper = mount(<Select options={options} selectedIndex={2} />)

    expect(wrapper.find('select').prop('defaultValue')).toBe('third')
})

test('Select renders with name attribute if passed', () => {
    const wrapper = shallow(<Select name="test-name" />)

    expect(wrapper.find('select').prop('name')).toBe('test-name')
})

test('Select renders with id attribute if passed', () => {
    const wrapper = shallow(<Select id="test-id" />)

    expect(wrapper.find('select').prop('id')).toBe('test-id')
})

test('Select renders with multiple attribute if passed', () => {
    const wrapper = shallow(<Select multiple={true} />)

    expect(wrapper.find('select').prop('multiple')).toBe(true)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Select />)

    expect(wrapper.hasClass('c-select')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Select />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Select className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})
