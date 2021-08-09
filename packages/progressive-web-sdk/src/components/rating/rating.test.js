/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow, mount} from 'enzyme'
import React from 'react'

import Icon from '../icon'
import Image from '../image'
import Rating from './index'

const getFilledIcons = (wrapper) =>
    wrapper.find('RatingIcon').filter('[modifierClass="pw--filled"]')

test('Rating renders without errors', () => {
    const wrapper = mount(<Rating />)
    expect(wrapper.length).toBe(1)
})

test('makes filled and empty RatingIcons up to the total prop', () => {
    for (let n = 1; n < 10; n += 2) {
        const wrapper = shallow(<Rating total={n} />)

        expect(getFilledIcons(wrapper).length).toBe(n)
        expect(wrapper.find('RatingIcon').not('[modifierClass="pw--filled"]').length).toBe(n)
    }
})

test('includes the filled RatingIcons in a div with the correct width', () => {
    const wrapper = shallow(<Rating count={2} total={5} />)

    const filledIcons = getFilledIcons(wrapper)
    expect(filledIcons.length).toBe(5)

    const filledIconDiv = wrapper.find('.pw-rating__filled-icons')
    // All of the filled icons are in the same div
    expect(getFilledIcons(filledIconDiv).length).toBe(filledIcons.length)

    expect(filledIconDiv.prop('style').width).toBe('40%')
})

test('renders the named icon if no src is passed', () => {
    const wrapper = mount(<Rating total={5} name="plus" />)

    expect(wrapper.find(Icon).length).toBe(10)
    wrapper.find(Icon).forEach((icon) => {
        expect(icon.prop('name')).toBe('plus')
    })
    expect(wrapper.find(Image).length).toBe(0)
})

test('renders the given image if src is passed', () => {
    const wrapper = mount(<Rating total={5} name="plus" src="super-star.png" />)

    expect(wrapper.find(Icon).length).toBe(0)
    expect(wrapper.find(Image).length).toBe(10)
    wrapper.find(Image).forEach((image) => {
        expect(image.prop('src')).toBe('super-star.png')
    })
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Rating />)

    expect(wrapper.hasClass('pw-rating')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Rating />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Rating className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})
