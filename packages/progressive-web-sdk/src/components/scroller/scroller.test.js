/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

jest.mock('lodash.throttle')
import throttle from 'lodash.throttle'
throttle.mockImplementation((fn) => fn)

import Scroller from './index.jsx'

test('Scroller renders without errors', () => {
    const wrapper = mount(<Scroller>test</Scroller>)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Scroller>test</Scroller>)

    expect(wrapper.hasClass('pw-scroller')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Scroller children="test" />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Scroller className={name}>test</Scroller>)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

describe('Test with mock event listeners', () => {
    const addEventListener = window.addEventListener
    const removeEventListener = window.removeEventListener

    beforeEach(() => {
        window.addEventListener = jest.fn(addEventListener)
        window.removeEventListener = jest.fn(removeEventListener)
    })

    afterEach(() => {
        window.addEventListener = addEventListener
        window.removeEventListener = removeEventListener
    })

    test('registers a resize listener', () => {
        const wrapper = mount(<Scroller>Test</Scroller>)
        expect(window.addEventListener).toHaveBeenCalledWith(
            'resize',
            wrapper.instance().checkOverflow
        )
    })

    test('removes the resize listener on unmount', () => {
        const wrapper = mount(<Scroller>Test</Scroller>)
        const handler = wrapper.instance().checkOverflow

        wrapper.unmount()
        expect(window.removeEventListener).toHaveBeenCalledWith('resize', handler)
    })
})

test('checkOverflow sets no overflow if no overflow is necessary', () => {
    const wrapper = mount(<Scroller>test</Scroller>)

    wrapper.instance()._scroller = {
        scrollWidth: 100,
        clientWidth: 150
    }

    wrapper.instance().checkOverflow()

    expect(wrapper.state('overflowLeft')).toBe(false)
    expect(wrapper.state('overflowRight')).toBe(false)
})

test('checkOverflow sets overflow width if necessary', () => {
    const wrapper = mount(<Scroller>test</Scroller>)

    wrapper.instance()._scroller = {
        scrollWidth: 150,
        clientWidth: 100
    }

    wrapper.instance().checkOverflow()

    expect(wrapper.state('overflowLeft')).toBe(false)
    expect(wrapper.state('overflowRight')).toBe(true)
    expect(wrapper.state('overflowWidth')).toBe(50)
})

test('handleScroll sets the left overflow if the scroll position is not at zero', () => {
    const wrapper = mount(<Scroller>test</Scroller>)

    wrapper.instance()._scroller = {
        scrollLeft: 5
    }

    wrapper.instance().handleScroll()

    expect(wrapper.state('overflowLeft')).toBe(true)
})

test('handleScroll clears the left overflow if the scroll position is at zero', () => {
    const wrapper = mount(<Scroller>test</Scroller>)

    wrapper.setState({overflowLeft: true})

    wrapper.instance()._scroller = {
        scrollLeft: 0
    }

    wrapper.instance().handleScroll()

    expect(wrapper.state('overflowLeft')).toBe(false)
})

test('handleScroll sets the right overflow if the scroll position is not at maximum', () => {
    const wrapper = mount(<Scroller>test</Scroller>)

    wrapper.setState({overflowWidth: 10, overflowLeft: true})

    wrapper.instance()._scroller = {
        scrollLeft: 5
    }

    wrapper.instance().handleScroll()

    expect(wrapper.state('overflowRight')).toBe(true)
})

test('handleScroll clears the right overflow if the scroll position is at maximum', () => {
    const wrapper = mount(<Scroller>test</Scroller>)

    wrapper.setState({overflowRight: true, overflowWidth: 10})

    wrapper.instance()._scroller = {
        scrollLeft: 10
    }

    wrapper.instance().handleScroll()

    expect(wrapper.state('overflowRight')).toBe(false)
})
