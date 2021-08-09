/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow} from 'enzyme'
import React from 'react'

import Sheet from '../sheet'
import {DefaultAsk} from './index'

/* eslint-disable newline-per-chained-call, max-nested-callbacks */
describe('DefaultAsk', () => {
    let mocks
    let wrapper

    beforeEach(() => {
        mocks = {
            accepted: jest.fn().mockReturnValue(Promise.resolve()),
            dismissed: jest.fn().mockReturnValue(Promise.resolve()),
            shouldAsk: false
        }

        wrapper = shallow(<DefaultAsk {...mocks} />)
    })

    test('renders without errors', () => {
        expect(wrapper.length).toBe(1)
    })

    test('includes the channelName prop if provided', () => {
        wrapper = shallow(<DefaultAsk channelName="foo" {...mocks} />)
        expect(wrapper.instance().props.channelName).toBe('foo')
    })

    test('includes the component class name with no className prop', () => {
        const sheet = wrapper.find(Sheet)

        expect(sheet.hasClass('pw-push-messaging__default-ask')).toBe(true)
    })

    test("does not render an 'undefined' class with no className", () => {
        const sheet = wrapper.find(Sheet)

        expect(sheet.hasClass('undefined')).toBe(false)
    })

    test('renders the contents of the className prop if present', () => {
        ;['test', 'test another'].forEach((name) => {
            wrapper = shallow(<DefaultAsk className={name} {...mocks} />)
            const sheet = wrapper.find(Sheet)
            expect(sheet.hasClass(name)).toBe(true)
        })
    })

    test('Sheet is shown when shouldAsk is true', () => {
        wrapper = shallow(<DefaultAsk {...mocks} shouldAsk={true} />)
        const sheet = wrapper.find(Sheet)
        expect(sheet.props().open).toBe(true)
    })

    test('Sheet is not shown when shouldAsk is false', () => {
        wrapper = shallow(<DefaultAsk {...mocks} shouldAsk={false} />)
        const sheet = wrapper.find(Sheet)
        expect(sheet.props().open).toBe(false)
    })

    describe('_dismissed and _accepted class methods', () => {
        let onDismiss
        let onSuccess

        beforeEach(() => {
            onDismiss = jest.fn()
            onSuccess = jest.fn()
        })

        test('_dismissed calls dismissed prop and onDismiss callback on dismissal', () => {
            wrapper = shallow(
                <DefaultAsk
                    channelName="foo"
                    {...mocks}
                    onDismiss={onDismiss}
                    onSuccess={onSuccess}
                />
            )
            const instance = wrapper.instance()

            return instance._dismissed().then(() => {
                expect(mocks.dismissed.mock.calls.length).toBe(1)
                expect(onDismiss.mock.calls[0][0]).toBe('foo')
            })
        })

        test('_accepted calls accepted prop and onSuccess callback, if system ask is accepted', () => {
            mocks.accepted = jest.fn().mockReturnValue(Promise.resolve({subscribed: true}))

            wrapper = shallow(
                <DefaultAsk
                    channelName="foo"
                    {...mocks}
                    onDismiss={onDismiss}
                    onSuccess={onSuccess}
                />
            )
            const instance = wrapper.instance()

            return instance._accepted().then(() => {
                expect(mocks.accepted.mock.calls.length).toBe(1)
                expect(onSuccess.mock.calls[0][0]).toBe('foo')
                expect(wrapper.state().didAccept).toBe(true)
            })
        })

        test('_accepted calls onDismiss callback if system ask is dismissed', () => {
            mocks.accepted = jest.fn().mockReturnValue(Promise.resolve({subscribed: false}))

            wrapper = shallow(
                <DefaultAsk
                    channelName="foo"
                    {...mocks}
                    onDismiss={onDismiss}
                    onSuccess={onSuccess}
                />
            )
            const instance = wrapper.instance()

            return instance._accepted().then(() => {
                expect(mocks.accepted.mock.calls.length).toBe(1)
                expect(onDismiss.mock.calls[0][0]).toBe('foo')
                expect(wrapper.state().didAccept).toBe(true)
            })
        })

        test('_accepted changes state.didAccept back to false only if canSubscribe is true', () => {
            mocks.accepted = jest
                .fn()
                .mockReturnValue(Promise.resolve({subscribed: false, canSubscribe: true}))

            wrapper = shallow(
                <DefaultAsk
                    channelName="foo"
                    {...mocks}
                    onDismiss={onDismiss}
                    onSuccess={onSuccess}
                />
            )
            const instance = wrapper.instance()

            return instance._accepted().then(() => {
                expect(mocks.accepted.mock.calls.length).toBe(1)
                expect(onDismiss.mock.calls[0][0]).toBe('foo')
                expect(wrapper.state().didAccept).toBe(false)
            })
        })
    })
})
