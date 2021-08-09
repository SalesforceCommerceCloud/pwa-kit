/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
/* eslint-env jest */
import React from 'react'

import CardVerification from './index.jsx'

test('CardVerification renders without errors', () => {
    const wrapper = mount(<CardVerification />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<CardVerification />)

    expect(wrapper.hasClass('pw-card-verification')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<CardVerification />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<CardVerification className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('Amex hint icon is displayed for Amex ', () => {
    const amex = '3489333322221111'
    const wrapper = mount(<CardVerification cardNumber={amex} />)

    expect(wrapper.find('svg.pw-card-verification__icon--amex-hint').length).toBe(1)
})

test('default hint icon is displayed for Visa  ', () => {
    const visa = '4111111111111111'
    const wrapper = mount(<CardVerification cardNumber={visa} />)

    expect(wrapper.find('svg.pw-card-verification__icon--default-hint').length).toBe(1)
})

test('cvv limits the input to 3 for default credit card', () => {
    const cvvNumber = '123456'

    const wrapper = mount(<CardVerification value={cvvNumber} />)
    expect(wrapper.find('input').prop('value').length).toBe(3)
})

test('cvv should not take asterisk as an input', () => {
    const cvvNumber = '12*'

    const wrapper = mount(<CardVerification value={cvvNumber} />)
    expect(wrapper.find('input').prop('value')).toBe('12')
})

test('cvv limits the input to 4 for Amex', () => {
    const amex = '3489333322221111'
    const cvvNumber = '123456'

    const wrapper = mount(<CardVerification cardNumber={amex} value={cvvNumber} />)
    expect(wrapper.find('input').prop('value').length).toBe(4)
})
