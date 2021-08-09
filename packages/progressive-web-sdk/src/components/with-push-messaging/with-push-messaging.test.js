/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {mount} from 'enzyme'
import React from 'react'
import sinon from 'sinon'
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

import {initialState} from '../../store/push-messaging/reducer'
import {withPushMessaging} from './index'

/* eslint-disable newline-per-chained-call, max-nested-callbacks */
describe('withPushMessaging higher order component', () => {
    const mockStore = configureMockStore([thunk])
    const store = mockStore({
        pushMessaging: initialState
    })

    const mockHtml = <div>Fake component</div>
    const mockComponent = () => mockHtml
    mockComponent.displayName = 'Foo'

    const WrapperComponent = withPushMessaging(mockComponent)
    let wrapper

    // Prevents console.error warnings because of missing required props
    const noop = () => {}
    const noops = {
        visitCountdowns: {},
        canSubscribe: true,
        channelOfferShown: noop,
        channels: [],
        isSubscribed: false,
        pageCount: 0,
        startVisitCountdown: noop,
        subscribe: noop
    }

    const _log = console.log

    beforeEach(() => {
        console.log = jest.fn()
    })

    afterAll(() => {
        console.log = _log
    })

    describe('renders', () => {
        beforeEach(() => {
            wrapper = mount(<WrapperComponent store={store} {...noops} />)
        })

        test('the wrapper of the given component, with the right displayName', () => {
            expect(wrapper.exists()).toBe(true)
            expect(wrapper.name()).toEqual('WithPushMessaging(Foo)')
        })

        test('the content of the given component, with the right displayName', () => {
            const wrappedComponent = wrapper.find(mockComponent.displayName)
            expect(wrappedComponent.containsMatchingElement(mockHtml)).toBe(true)
            expect(wrappedComponent.name()).toEqual(mockComponent.displayName)
        })
    })

    describe('componentWillReceiveProps', () => {
        let channelOfferShown
        const spy = sinon.spy(WrapperComponent.prototype, 'componentWillReceiveProps')

        beforeEach(() => {
            channelOfferShown = jest.fn()
            spy.reset()
        })

        test('calls channelOfferShown if `shouldAsk` returned true during a change in state', () => {
            wrapper = mount(
                <WrapperComponent
                    store={store}
                    {...noops}
                    channelOfferShown={channelOfferShown}
                    channelName="bar"
                    showOnPageCount={false}
                />
            )

            expect(wrapper.state().shouldAsk).toBe(false)

            // Any prop change will do
            wrapper.setProps({
                pageCount: 1
            })

            expect(wrapper.state().shouldAsk).toBe(true)
            expect(channelOfferShown.mock.calls[0][0]).toEqual('bar')
        })

        test('does not call setState if state change would be identical', () => {
            wrapper = mount(
                <WrapperComponent store={store} {...noops} channelOfferShown={channelOfferShown} />
            )

            expect(wrapper.state().shouldAsk).toBe(false)

            // Any prop change will do
            wrapper.setProps({
                pageCount: 1
            })

            expect(wrapper.state().shouldAsk).toBe(false)
            expect(channelOfferShown.mock.calls.length).toBe(0)
        })

        test('does not call channelOfferShown during a state change, if shouldAskResult is false', () => {
            wrapper = mount(
                <WrapperComponent
                    store={store}
                    {...noops}
                    channelOfferShown={channelOfferShown}
                    showOnPageCount={false}
                />
            )

            expect(wrapper.state().shouldAsk).toBe(false)

            // Any prop change will do
            wrapper.setProps({
                pageCount: 1
            })

            expect(wrapper.state().shouldAsk).toBe(true)

            wrapper.setProps({
                canSubscribe: false
            })

            expect(wrapper.state().shouldAsk).toBe(false)

            // We expect that channelOfferShown was not called again after we
            // received new props the second time
            expect(channelOfferShown.mock.calls.length).toBe(1)
        })

        test('does nothing if `canSubscribe` is false', () => {
            wrapper = mount(<WrapperComponent store={store} {...noops} canSubscribe={false} />)

            // Any prop change will do
            wrapper.setProps({
                pageCount: 1
            })

            wrapper.setProps({
                showOnPageCount: 4
            })

            expect(spy.firstCall.returned(false))
            expect(spy.secondCall.returned(false))
        })
    })

    describe('class method', () => {
        let wrappedComponent, startVisitCountdown, subscribe // eslint-disable-line one-var

        const getSubscribeMock = (didSubscribe, canSubscribe) =>
            jest.fn(
                () =>
                    new Promise((resolve) => {
                        resolve({
                            subscribed: didSubscribe || false,
                            canSubscribe: typeof canSubscribe !== 'undefined' ? canSubscribe : true
                        })
                    })
            )

        beforeEach(() => {
            startVisitCountdown = jest.fn()
            subscribe = getSubscribeMock()
        })

        test('`startVisitCountdown` only calls startVisitCountdown if deferOnDismissal is > 0', () => {
            wrapper = mount(
                <WrapperComponent
                    store={store}
                    {...noops}
                    channelName="foo"
                    startVisitCountdown={startVisitCountdown}
                />
            )
            const instance = wrapper.instance()

            instance.startVisitCountdown()

            wrapper.setProps({
                deferOnDismissal: false
            })

            instance.startVisitCountdown()

            expect(startVisitCountdown.mock.calls[0]).toEqual([3, 'foo'])
            expect(startVisitCountdown.mock.calls.length).toBe(1)
        })

        test('`dismissed` calls the startVisitCountdown method', () => {
            wrappedComponent = wrapper.find(mockComponent.displayName)

            const instance = wrapper.instance()
            instance.startVisitCountdown = jest.fn()

            return wrappedComponent
                .props()
                .dismissed()
                .then(() => {
                    expect(instance.startVisitCountdown.mock.calls.length).toBe(1)
                })
        })

        test('`accepted` calls subscribe with a provided channelName prop', () => {
            wrapper = mount(
                <WrapperComponent
                    store={store}
                    {...noops}
                    subscribe={subscribe}
                    channelName="bar"
                />
            )
            wrappedComponent = wrapper.find(mockComponent.displayName)

            return wrappedComponent
                .props()
                .accepted()
                .then(() => {
                    expect(subscribe.mock.calls[0][0]).toEqual({bar: true})
                })
        })

        test('`accepted` calls subscribe with no channelName if none provided', () => {
            wrapper = mount(<WrapperComponent store={store} {...noops} subscribe={subscribe} />)
            wrappedComponent = wrapper.find(mockComponent.displayName)

            return wrappedComponent
                .props()
                .accepted()
                .then(() => {
                    expect(subscribe.mock.calls[0][0]).toBeUndefined()
                })
        })

        describe('`accepted`', () => {
            test('does not call startVisitCountdown class method if user accepts system-ask', () => {
                subscribe = getSubscribeMock(true)
                wrapper = mount(<WrapperComponent store={store} {...noops} subscribe={subscribe} />)
                wrappedComponent = wrapper.find(mockComponent.displayName)

                const instance = wrapper.instance()
                instance.startVisitCountdown = jest.fn()

                return wrappedComponent
                    .props()
                    .accepted()
                    .then(() => {
                        expect(instance.startVisitCountdown.mock.calls.length).toBe(0)
                        expect(console.log.mock.calls[0][1]).toEqual('Subscribed ')
                    })
            })

            test('Logs the channel name properly if user accepts system-ask', () => {
                subscribe = getSubscribeMock(true)
                wrapper = mount(
                    <WrapperComponent
                        store={store}
                        {...noops}
                        subscribe={subscribe}
                        channelName="foo"
                    />
                )
                wrappedComponent = wrapper.find(mockComponent.displayName)

                return wrappedComponent
                    .props()
                    .accepted()
                    .then(() => {
                        expect(console.log.mock.calls[0][1]).toEqual('Subscribed to channel foo')
                    })
            })

            test('calls startVisitCountdown class method if user dismissed system-ask', () => {
                wrapper = mount(<WrapperComponent store={store} {...noops} subscribe={subscribe} />)
                wrappedComponent = wrapper.find(mockComponent.displayName)

                const instance = wrapper.instance()
                instance.startVisitCountdown = jest.fn()

                return wrappedComponent
                    .props()
                    .accepted()
                    .then(() => {
                        expect(instance.startVisitCountdown.mock.calls.length).toBe(1)
                        expect(console.log.mock.calls[0][1]).toEqual('System ask was dismissed')
                    })
            })

            test('logs appropriately when user is unable to be subscribe', () => {
                subscribe = getSubscribeMock(false, false)
                wrapper = mount(<WrapperComponent store={store} {...noops} subscribe={subscribe} />)
                wrappedComponent = wrapper.find(mockComponent.displayName)

                return wrappedComponent
                    .props()
                    .accepted()
                    .then(() => {
                        expect(console.log.mock.calls[0][1]).toEqual(
                            'Permissions blocked by user; can no longer subscribe.'
                        )
                    })
            })
        })
    })
})
