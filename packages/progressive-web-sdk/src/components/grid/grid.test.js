/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

/**
 * @deprecated 🚨 since version 1.2.
 *
 * If you need similar behaviour, please see our responsive grid documentation
 * https://docs.mobify.com/progressive-web/latest/guides/responsive-grid/
 *
 **/

import {Grid} from './index'
import GridSpan, {
    MOBILE_BREAKPOINT,
    TABLET_BREAKPOINT,
    DESKTOP_BREAKPOINT,
    MOBILE_COLUMN_COUNT,
    TABLET_COLUMN_COUNT,
    DESKTOP_COLUMN_COUNT
} from './grid-span.jsx'

// BREAKPOINTS and COLUMNS should match this order: Mobile, Tablet, Desktop
const BREAKPOINTS = [MOBILE_BREAKPOINT, TABLET_BREAKPOINT, DESKTOP_BREAKPOINT]
const COLUMNS = [MOBILE_COLUMN_COUNT, TABLET_COLUMN_COUNT, DESKTOP_COLUMN_COUNT]

test('Grid renders without errors', () => {
    const wrapper = mount(<Grid />)
    expect(wrapper.length).toBe(1)
})

/* eslint-disable newline-per-chained-call */
test('includes the component class name with no className prop', () => {
    const wrapper = shallow(<Grid />)

    expect(wrapper.hasClass('pw-grid')).toBe(true)
})

test("does not render an 'undefined' class with no className", () => {
    const wrapper = shallow(<Grid />)

    expect(wrapper.hasClass('undefined')).toBe(false)
})

test('renders the contents of the className prop if present', () => {
    ;['test', 'test another'].forEach((name) => {
        const wrapper = shallow(<Grid className={name} />)

        expect(wrapper.hasClass(name)).toBe(true)
    })
})

test('renders full width class if no span is provided', () => {
    const wrapper = shallow(<GridSpan />)

    BREAKPOINTS.forEach((breakpoint) => {
        expect(wrapper.hasClass(`pw--full-width@${breakpoint}`)).toBe(true)
    })
})

test('renders the minimum sized span when a span of 1 is provided', () => {
    BREAKPOINTS.forEach((breakpoint) => {
        const wrapper = shallow(<GridSpan />)
        const props = {span: 1}

        wrapper.setProps({
            [breakpoint]: props
        })

        expect(wrapper.hasClass(`pw--span-1@${breakpoint}`)).toBe(true)
    })
})

test('renders the max width span class if the max span value is provided', () => {
    BREAKPOINTS.forEach((breakpoint, i) => {
        const wrapper = shallow(<GridSpan />)
        const maxColumns = COLUMNS[i]
        const props = {span: maxColumns}

        wrapper.setProps({
            [breakpoint]: props
        })

        expect(wrapper.hasClass(`pw--span-${maxColumns}@${breakpoint}`)).toBe(true)
    })
})

test('renders no span class if a value greater than the max span is provided', () => {
    BREAKPOINTS.forEach((breakpoint, i) => {
        const wrapper = shallow(<GridSpan />)
        const overTheMaxColumns = COLUMNS[i] + 1
        const props = {span: overTheMaxColumns}

        wrapper.setProps({
            [breakpoint]: props
        })

        expect(wrapper.hasClass(`pw--span-${overTheMaxColumns}@${breakpoint}`)).toBe(false)
    })
})

test('renders the full width class if span value is null rather than a `pw--span-null` class', () => {
    BREAKPOINTS.forEach((breakpoint) => {
        const wrapper = shallow(<GridSpan />)
        const props = {span: null}

        wrapper.setProps({
            [breakpoint]: props
        })

        expect(wrapper.hasClass(`pw--full-width@${breakpoint}`)).toBe(true)
        expect(wrapper.hasClass(`pw--span-null@${breakpoint}`)).toBe(false)
    })
})

test('renders the full width class if a value greater than the max span is provided', () => {
    BREAKPOINTS.forEach((breakpoint, i) => {
        const wrapper = shallow(<GridSpan />)
        const overTheMaxColumns = COLUMNS[i] + 1
        const props = {span: overTheMaxColumns}

        wrapper.setProps({
            [breakpoint]: props
        })

        expect(wrapper.hasClass(`pw--full-width@${breakpoint}`)).toBe(true)
    })
})

test('renders no pre or post class if no pre or post value is provided', () => {
    ;['pre', 'post'].forEach((currentProp) => {
        BREAKPOINTS.forEach((breakpoint, i) => {
            // Loop over the number of columns the current breakpoint has
            for (let span = 1; span < COLUMNS[i]; span++) {
                const wrapper = shallow(<GridSpan />)
                const className = `pw--${currentProp}-${span}@${breakpoint}`
                expect(wrapper.hasClass(className)).toBe(false)
            }
        })
    })
})

test('renders a pre or post class when a pre or post value is provided', () => {
    ;['pre', 'post'].forEach((currentProp) => {
        BREAKPOINTS.forEach((breakpoint, i) => {
            // Loop over the number of columns the current breakpoint has
            for (let span = 1; span < COLUMNS[i]; span++) {
                const wrapper = shallow(<GridSpan />)
                const props = {[currentProp]: span}

                wrapper.setProps({
                    [breakpoint]: props
                })

                const className = `pw--${currentProp}-${span}@${breakpoint}`
                expect(wrapper.hasClass(className)).toBe(true)
            }
        })
    })
})
