/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount} from 'enzyme'
import React from 'react'
import PropTypes from 'prop-types'

import Split from './index'
import cookieManager from '../../utils/cookie-manager'

jest.useFakeTimers()

// We cannot expire the cookies in jest. Therefore, let's make sure each test
// is using a new cookie name
const TEST_COOKIENAME = 'test'
let cookieIndex = 0

const getNewCookieName = () => {
    const newCookieName = `${TEST_COOKIENAME}_${cookieIndex}`
    cookieIndex++
    return newCookieName
}

const SplitValueReader = ({splitValue}) => {
    return (
        <div className="splitValue" data-split-value={splitValue}>
            {splitValue}
        </div>
    )
}

SplitValueReader.propTypes = {
    splitValue: PropTypes.string
}

let wrapper
let currentCookieName

describe('Split', () => {
    beforeEach(() => {
        currentCookieName = getNewCookieName()
    })

    afterEach(() => {
        wrapper.unmount()
    })

    test('default state and props are defined', () => {
        wrapper = mount(<Split splitCookieName={currentCookieName} />)
        const node = wrapper.instance()

        expect(node.props.splitCookieName).toBe(currentCookieName)
        expect(node.props.defaultSplitValue).toBe(null)
        expect(node.props.showOnVariant).toBe(null)
        expect(node.state.splitValue).toBe(null)
    })

    test('default split value matches splitValue in state when defined', () => {
        wrapper = mount(<Split splitCookieName={currentCookieName} defaultSplitValue="A" />)
        const node = wrapper.instance()

        expect(node.props.defaultSplitValue).toBe('A')
        expect(node.state.splitValue).toBe('A')
    })

    test('splitValue updates when cookie manager updates', () => {
        wrapper = mount(<Split splitCookieName={currentCookieName} defaultSplitValue="A" />)
        const node = wrapper.instance()

        expect(node.state.splitValue).toBe('A')

        cookieManager.set(currentCookieName, 'B', null, 3000)
        cookieManager.pollForAllCookieUpdate()

        expect(node.state.splitValue).toBe('B')
    })

    test('splitValue updates when cookie manager does polling update', () => {
        wrapper = mount(<Split splitCookieName={currentCookieName} defaultSplitValue="A" />)
        const node = wrapper.instance()

        expect(node.state.splitValue).toBe('A')

        cookieManager.pollForAllCookieUpdate()
        cookieManager.set(currentCookieName, 'B', null, 3000)
        jest.runOnlyPendingTimers()

        expect(node.state.splitValue).toBe('B')
    })

    test('renders children if showOnVariant value is null and cookie is not defined', () => {
        wrapper = mount(
            <Split splitCookieName={currentCookieName} showOnVariant="null">
                <div className="skeleton">Skeleton</div>
            </Split>
        )

        expect(wrapper.instance().state.splitValue).toBe(null)
        expect(wrapper.find('.skeleton').length).toBe(1)
    })

    test('renders children if showOnVariant value matches cookie value', () => {
        wrapper = mount(
            <Split splitCookieName={currentCookieName} showOnVariant="A">
                <div className="variantA">Variant A</div>
            </Split>
        )

        cookieManager.set(currentCookieName, 'A')
        cookieManager.pollForAllCookieUpdate()
        wrapper.update()

        // Only to cover the re-render path in unit test
        cookieManager.pollForAllCookieUpdate()
        wrapper.update()

        expect(wrapper.instance().state.splitValue).toBe('A')
        expect(wrapper.find('.variantA').length).toBe(1)
    })

    test('propergate splitValue props to children ', () => {
        wrapper = mount(
            <Split splitCookieName={currentCookieName}>
                <SplitValueReader />
                <SplitValueReader />
            </Split>
        )

        cookieManager.set(currentCookieName, 'B')
        cookieManager.pollForAllCookieUpdate()
        wrapper.update()

        expect(wrapper.find('.splitValue[data-split-value="B"]').length).toBe(2)
    })

    test('renders children if splitCookieName is not defined', () => {
        wrapper = mount(
            <Split>
                <div className="child">Child</div>
            </Split>
        )

        expect(wrapper.find('.child').length).toBe(1)
    })
})
