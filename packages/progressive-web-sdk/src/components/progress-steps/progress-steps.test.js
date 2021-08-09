/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount, shallow} from 'enzyme'
import React from 'react'

import Icon from '../icon'
import {ProgressSteps, ProgressStepsItem} from './index'

/* eslint-disable newline-per-chained-call, max-nested-callbacks */

describe('ProgressSteps', () => {
    test('renders without errors', () => {
        const wrapper = mount(
            <ProgressSteps>
                <ProgressStepsItem title="Test" />
            </ProgressSteps>
        )
        expect(wrapper.length).toBe(1)
    })

    test('includes the component class name with no className prop', () => {
        const wrapper = shallow(
            <ProgressSteps>
                <ProgressStepsItem title="Test" />
            </ProgressSteps>
        )

        expect(wrapper.hasClass('pw-progress-steps')).toBe(true)
    })

    test("does not render an 'undefined' class with no className", () => {
        const wrapper = shallow(
            <ProgressSteps>
                <ProgressStepsItem title="Test" />
            </ProgressSteps>
        )

        expect(wrapper.hasClass('undefined')).toBe(false)
    })

    test('renders the contents of the className prop if present', () => {
        ;['test', 'test another'].forEach((name) => {
            const wrapper = shallow(
                <ProgressSteps className={name}>
                    <ProgressStepsItem title="Test" />
                </ProgressSteps>
            )

            expect(wrapper.hasClass(name)).toBe(true)
        })
    })

    test('works with different numbers of items', () => {
        ;[1, 2, 3, 4].forEach((n) => {
            const items = []
            for (let i = 0; i < n; i++) {
                items.push(<ProgressStepsItem title="Test" key={i} />)
            }
            const wrapper = shallow(<ProgressSteps>{items}</ProgressSteps>)

            expect(wrapper.children().length).toBe(n)

            wrapper.children().forEach((item, idx) => {
                expect(item.type()).toBe(ProgressStepsItem)
                expect(item.prop('total')).toBe(n)
                expect(item.prop('number')).toBe(idx + 1)
                expect(item.prop('completed')).toBe(true)
            })
        })
    })

    test('flips the completed prop to false starting with the current item', () => {
        const wrapper = shallow(
            <ProgressSteps>
                <ProgressStepsItem title="Test" />
                <ProgressStepsItem title="Test" current />
                <ProgressStepsItem title="Test" />
            </ProgressSteps>
        )

        expect(wrapper.children().map((item) => item.prop('completed'))).toEqual([
            true,
            false,
            false
        ])
    })

    test('if disableIncompleteSteps items is true, flips the disabled prop to true after the current item', () => {
        const wrapper = shallow(
            <ProgressSteps disableIncompleteSteps>
                <ProgressStepsItem title="Test" />
                <ProgressStepsItem title="Test" current />
                <ProgressStepsItem title="Test" />
                <ProgressStepsItem title="Test" />
            </ProgressSteps>
        )

        expect(wrapper.children().map((item) => item.prop('disabled'))).toEqual([
            false,
            false,
            true,
            true
        ])
    })
})

describe('ProgressStepsItem', () => {
    test('renders without errors', () => {
        const wrapper = mount(<ProgressStepsItem title="Test" />)
        expect(wrapper.length).toBe(1)
    })

    test('includes the component class name with no className prop', () => {
        const wrapper = shallow(<ProgressStepsItem title="Test" />)

        expect(wrapper.hasClass('pw-progress-steps__item')).toBe(true)
    })

    test("does not render an 'undefined' class with no className", () => {
        const wrapper = shallow(<ProgressStepsItem title="Test" />)

        expect(wrapper.hasClass('undefined')).toBe(false)
    })

    test('renders the contents of the className prop if present', () => {
        ;['test', 'test another'].forEach((name) => {
            const wrapper = shallow(<ProgressStepsItem className={name} title="Test" />)

            expect(wrapper.hasClass(name)).toBe(true)
        })
    })

    test('renders a link if an href is passed', () => {
        const wrapper = mount(<ProgressStepsItem title="Test" href="test.html" />)

        const link = wrapper.find('a.pw-progress-steps__step')
        expect(link.length).toBe(1)
        expect(link.prop('href')).toBe('test.html')
    })

    test('renders an icon in the badge if passed', () => {
        const wrapper = shallow(<ProgressStepsItem title="Test" icon="check" />)

        const badge = wrapper.find('.pw-progress-steps__badge')
        expect(badge.childAt(0).type()).toBe(Icon)
        expect(badge.childAt(0).prop('name')).toBe('check')
    })

    test('renders the number in the badge if no icon is passed', () => {
        const wrapper = shallow(<ProgressStepsItem title="Test" number={5} />)

        const badge = wrapper.find('.pw-progress-steps__badge')
        expect(badge.text()).toBe('5')
    })

    test('if disabled, does not pass its href or onClick', () => {
        const wrapper = mount(
            <ProgressStepsItem title="Test" href="test.html" onClick={() => {}} disabled />
        )

        const el = wrapper.find('div.pw-progress-steps__step')
        expect(el.length).toBe(1)
        expect(el.prop('href')).toBe(undefined)
        expect(el.prop('onClick')).toBe(undefined)
    })
})
