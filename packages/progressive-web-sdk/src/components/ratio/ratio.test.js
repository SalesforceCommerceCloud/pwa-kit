/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import Ratio, {aspectPropType} from './index.jsx'

const invalidPropError =
    'The aspect prop must contain a ":" character between two positive integers, for example 4:3'

test('Ratio renders without errors', () => {
    const wrapper = mount(<Ratio />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Ratio />)

    expect(wrapper.hasClass('pw-ratio')).toBe(true)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Ratio className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('renders the aspect ratio as a `padding-bottom` percentage on `pw-ratio__fill`', () => {
    const wrapper1 = shallow(<Ratio aspect="4:3" />)
    const wrapper2 = shallow(<Ratio width="4" height="3" />)
    const ratioPercent = '75%'

    expect(wrapper1.find('.pw-ratio__fill').prop('style').paddingBottom).toBe(ratioPercent)
    expect(wrapper2.find('.pw-ratio__fill').prop('style').paddingBottom).toBe(ratioPercent)
})

test('fails propType validation if aspect prop does not contain ":"', () => {
    expect(aspectPropType({aspect: '43'}, 'aspect')).toEqual(new Error(invalidPropError))
})

test('fails propType validation if aspect prop has non integer values', () => {
    expect(aspectPropType({aspect: '4a:3b'}, 'aspect')).toEqual(new Error(invalidPropError))
})

test('fails propType validation if aspect prop has non positive integer values', () => {
    expect(aspectPropType({aspect: '0:4'}, 'aspect')).toEqual(new Error(invalidPropError))
})

test('fails propType validation if aspect prop has integer with leading zeroes', () => {
    expect(aspectPropType({aspect: '16:08'}, 'aspect')).toEqual(new Error(invalidPropError))
})
