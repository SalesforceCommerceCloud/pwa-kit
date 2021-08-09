/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow} from 'enzyme'
import React from 'react'

import Button from '../button'
import {InlineAsk} from './index'

describe('InlineAsk', () => {
    let defaults
    let wrapper

    beforeEach(() => {
        defaults = {
            canSubscribe: true,
            channelOfferShown: jest.fn(),
            isSubscribed: false,
            notSupportedNotification: jest.fn(),
            subscribe: jest.fn()
        }

        wrapper = shallow(<InlineAsk {...defaults} />, {disableLifecycleMethods: true})
    })

    test('renders without errors', () => {
        expect(wrapper.length).toBe(1)
    })

    test('includes the component class name with no className prop', () => {
        expect(wrapper.hasClass('pw-inline-ask')).toBe(true)
    })

    test('does not render an `undefined` class with no className', () => {
        expect(wrapper.hasClass('undefined')).toBe(false)
    })

    test('renders the contents of the className prop if present', () => {
        ;['test', 'test another'].forEach((name) => {
            wrapper = shallow(<InlineAsk className={name} {...defaults} />)
            expect(wrapper.hasClass(name)).toBe(true)
        })
    })

    test('calls the channelOfferShown method on `componentDidMount`', () => {
        wrapper.instance().componentDidMount()

        // We expect 2 because one is from the initial `shallow()` in the above
        // `beforeEach`. The second is the direct call to `componentDidMount()`
        // in this test.
        expect(defaults.channelOfferShown.mock.calls.length).toBe(1)
    })

    test('renders button when `isSubscribed` is false, and success text if true', () => {
        expect(wrapper.find(Button).length).toBe(1)

        wrapper.setProps({isSubscribed: true})

        expect(wrapper.find(Button).length).toBe(0)
        expect(wrapper.find('.pw-inline-ask__success').length).toBe(1)
    })

    test('calls the right method when button is tapped', () => {
        const button = wrapper.find(Button)
        button.simulate('click')
        wrapper.setProps({canSubscribe: false})
        button.simulate('click')

        expect(defaults.subscribe.mock.calls.length).toBe(1)
        expect(defaults.notSupportedNotification.mock.calls.length).toBe(1)
    })
})
