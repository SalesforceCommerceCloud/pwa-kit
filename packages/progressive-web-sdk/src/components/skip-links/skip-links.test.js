/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import SkipLinks, {targetPropType} from './index.jsx'

const invalidPropError =
    'SkipLinks item target is invalid. Must be an ID selector, starting with "#" followed by alphanumeric characters, dashes and underscores with no spaces.'
const itemsStub = [
    {
        target: '#test1',
        label: 'Test 1'
    },
    {
        target: '#test2',
        label: 'Test 2'
    },
    {
        target: '#test3',
        label: 'Test 3'
    }
]

test('SkipLinks renders without errors', () => {
    const wrapper = mount(<SkipLinks items={[]} />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<SkipLinks items={[]} />)

    expect(
        wrapper
            .first()
            .prop('className')
            .startsWith('pw-skip-links')
    ).toBe(true)
})

test('creates a link for each item passed to the items prop', () => {
    const wrapper = shallow(<SkipLinks items={itemsStub} />)

    expect(wrapper.find('.pw-skip-links__anchor').length).toBe(itemsStub.length)
})

test("Each rendered link's href should match that item's target prop", () => {
    const wrapper = shallow(<SkipLinks items={itemsStub} />)

    wrapper.find('.pw-skip-links__anchor').forEach((item, idx) => {
        const target = itemsStub[idx].target
        expect(item.prop('href')).toBe(target)
    })
})

test("Each rendered link's text should match that item's label prop", () => {
    const wrapper = shallow(<SkipLinks items={itemsStub} />)

    wrapper.find('.pw-skip-links__anchor').forEach((item, idx) => {
        const label = itemsStub[idx].label
        expect(item.text()).toBe(label)
    })
})

test('fails propType validation if target does not start with "#"', () => {
    expect(targetPropType([{target: 'theCharacterShouldBeAtStart', label: ''}])).toEqual(
        new Error(invalidPropError)
    )
})

test('fails propType validation if target has spaces', () => {
    expect(targetPropType([{target: '#no spaces allowed', label: ''}])).toEqual(
        new Error(invalidPropError)
    )
})

test('fails propType validation if target has non-alphanumeric characters', () => {
    expect(targetPropType([{target: '#invalid@string.com', label: ''}])).toEqual(
        new Error(invalidPropError)
    )
})
