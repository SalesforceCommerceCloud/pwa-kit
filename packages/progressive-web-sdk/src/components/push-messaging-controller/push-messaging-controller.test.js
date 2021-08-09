/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {shallow} from 'enzyme'
import React from 'react'
import sinon from 'sinon'

import Sheet from '../sheet'
import {PushMessagingController} from './index'
import {MESSAGING_STATUS} from '../../store/push-messaging/constants'

/* eslint-disable newline-per-chained-call, max-nested-callbacks */
describe('PushMessagingController', () => {
    let mocks
    const spy = sinon.spy(PushMessagingController.prototype, 'shouldComponentUpdate')

    beforeEach(() => {
        mocks = {
            isSubscribed: false,
            isSystemAskShown: false,
            rehydrateVisitCountdowns: jest.fn(),
            rehydratePageCount: jest.fn(),
            stateUpdate: jest.fn(),
            notificationClick: jest.fn(),
            canSubscribe: true,
            setVisitEndTimestamp: jest.fn()
        }
        spy.reset()
    })

    test('renders a Sheet component correctly; closed by default', () => {
        const wrapper = shallow(<PushMessagingController {...mocks} />, {
            disableLifecycleMethods: true
        })
        const props = wrapper.props()

        expect(wrapper.is(Sheet)).toBe(true)
        expect(props.open).toEqual(false)
        expect(props.effect).toEqual('modal-center')
        expect(props.coverage).toEqual('1%')
        expect(props.shrinkToContent).toBe(true)
    })

    test('renders an open Sheet if conditions are met', () => {
        const wrapper = shallow(
            <PushMessagingController
                dimScreenOnSystemAsk={true}
                {...mocks}
                isSystemAskShown={true}
            />,
            {disableLifecycleMethods: true}
        )
        expect(wrapper.props().open).toBeTruthy()
    })

    test('does not open Sheet if isSubscribed is true, despite other matching conditions', () => {
        const wrapper = shallow(
            <PushMessagingController
                dimScreenOnSystemAsk={true}
                {...mocks}
                isSystemAskShown={true}
                isSubscribed={true}
            />,
            {disableLifecycleMethods: true}
        )
        expect(wrapper.props().open).toBe(false)
    })

    test('shouldComponentUpdate returns false if `dimScreenOnSystemAsk` is false', () => {
        const wrapper = shallow(
            <PushMessagingController dimScreenOnSystemAsk={false} {...mocks} />,
            {disableLifecycleMethods: true}
        )

        wrapper.setProps({isSystemAskShown: false})
        wrapper.setProps({isSystemAskShown: true})
        wrapper.setProps({dimScreenOnSystemAsk: true})

        expect(spy.firstCall.returned(false)).toBeTruthy()
        expect(spy.secondCall.returned(false)).toBeTruthy()
        expect(spy.thirdCall.returned(false)).toBeTruthy()
    })

    test('shouldComponentUpdate returns true only when `isSystemAskShown` changes if `dimScreenOnSystemAsk` is true', () => {
        const wrapper = shallow(
            <PushMessagingController dimScreenOnSystemAsk={true} {...mocks} />,
            {disableLifecycleMethods: true}
        )

        wrapper.setProps({isSystemAskShown: false})
        wrapper.setProps({isSystemAskShown: true})
        wrapper.setProps({dimScreenOnSystemAsk: true})

        expect(spy.firstCall.returned(false)).toBeTruthy()
        expect(spy.secondCall.returned(true)).toBeTruthy()
        expect(spy.thirdCall.returned(false)).toBeTruthy()
    })

    test('shouldComponentUpdate returns false if `canSubscribe` is false', () => {
        const wrapper = shallow(<PushMessagingController {...mocks} canSubscribe={false} />, {
            disableLifecycleMethods: true
        })

        wrapper.setProps({isSystemAskShown: true})

        expect(spy.firstCall.returned(false)).toBeTruthy()
    })

    test('componentWillMount calls setup methods', () => {
        shallow(<PushMessagingController {...mocks} canSubscribe={false} />, {
            disableLifecycleMethods: true
        })

        expect(mocks.rehydrateVisitCountdowns.mock.calls.length).toBe(1)
        expect(mocks.rehydratePageCount.mock.calls.length).toBe(1)
    })

    describe('methods which use the default PushMessagingController component', () => {
        let wrapper
        let instance
        const _error = console.error

        beforeEach(() => {
            wrapper = shallow(<PushMessagingController {...mocks} />, {
                disableLifecycleMethods: true
            })
            instance = wrapper.instance()
        })

        afterAll(() => {
            window.Progressive = undefined
            console.error = _error
        })

        describe('componentDidMount', () => {
            test('logs error message and updates status in push messaging store if Promise is undefined', () => {
                window.Progressive = {
                    MessagingClient: {
                        register: jest.fn()
                    }
                }
                console.error = jest.fn()

                return instance.componentDidMount().then((returnValue) => {
                    expect(console.error.mock.calls[0][0]).toEqual(
                        '[Messaging UI] Could not initialize the Messaging Client.'
                    )
                    expect(returnValue).toBeUndefined()
                    expect(window.Progressive.MessagingClient.register.mock.calls.length).toBe(0)
                    expect(mocks.stateUpdate.mock.calls.length).toBe(0)
                })
            })

            test('logs error message and updates status to FAILED if failed to initialize', () => {
                window.Progressive = {}
                window.Progressive.MessagingClientInitPromise = jest
                    .fn()
                    .mockReturnValue(Promise.reject())()
                window.Progressive.MessagingClient = {
                    register: jest.fn()
                }

                return instance.componentDidMount().then((returnValue) => {
                    expect(console.error.mock.calls[0][0]).toEqual(
                        '[Messaging UI] Could not initialize the Messaging Client.'
                    )
                    expect(returnValue).toBeUndefined()
                    expect(window.Progressive.MessagingClient.register.mock.calls.length).toBe(0)
                    expect(mocks.stateUpdate.mock.calls.length).toBe(1)
                    expect(mocks.stateUpdate.mock.calls[0][0]).toEqual({
                        status: MESSAGING_STATUS.FAILED
                    })
                })
            })

            test('calls MessagingClient.register with handleStateUpdate and handleNotificationClick, then calls stateUpdate', () => {
                window.Progressive = {}
                window.Progressive.MessagingClientInitPromise = jest
                    .fn()
                    .mockReturnValue(Promise.resolve())()
                window.Progressive.MessagingClient = {
                    register: jest.fn(() => Promise.resolve({foo: 'bar'})),
                    Events: {
                        notificationClick: 'mobifyMessagingNotificationClick',
                        messagingStateChange: 'mobifyMessagingStateChange'
                    }
                }

                return instance.componentDidMount().then(() => {
                    expect(window.Progressive.MessagingClient.register.mock.calls.length).toBe(2)
                    expect(window.Progressive.MessagingClient.register.mock.calls[0][0]).toBe(
                        instance.handleNotificationClick
                    )
                    expect(window.Progressive.MessagingClient.register.mock.calls[0][1]).toEqual(
                        window.Progressive.MessagingClient.Events.notificationClick
                    )
                    expect(window.Progressive.MessagingClient.register.mock.calls[1][0]).toBe(
                        instance.handleStateUpdate
                    )
                    expect(window.Progressive.MessagingClient.register.mock.calls[1][1]).toBe(
                        window.Progressive.MessagingClient.Events.messagingStateChange
                    )
                    expect(mocks.stateUpdate.mock.calls.length).toBe(1)
                    expect(mocks.stateUpdate.mock.calls[0][0]).toEqual({
                        foo: 'bar',
                        isReady: true,
                        status: MESSAGING_STATUS.READY
                    })
                })
            })
        })

        test('handleStateUpdate calls stateUpdate action with passed state object', () => {
            const testEvent = {
                detail: {
                    subscribed: true,
                    canSubscribe: true,
                    channels: ['foo', 'new-deals']
                }
            }

            instance.handleStateUpdate(testEvent)
            expect(mocks.stateUpdate.mock.calls[0][0]).toEqual(testEvent.detail)
        })

        test('handleNotificationClick does call `notificationClick` with the provided url if valid', () => {
            const validEvent = {
                detail: {
                    url: 'https://www.merlinspotions.com'
                }
            }

            instance.handleNotificationClick(validEvent)
            expect(mocks.notificationClick).toHaveBeenCalledWith(validEvent.detail.url)
        })

        test('handleNotificationClick does not call `notificationClick` if the url provided is invalid', () => {
            const invalidUrlEvent = {
                detail: {
                    url: 385713875135
                }
            }

            const anotherInvalidUrlEvent = {
                detail: {
                    url: ''
                }
            }

            instance.handleNotificationClick(invalidUrlEvent)
            instance.handleNotificationClick(anotherInvalidUrlEvent)

            expect(mocks.notificationClick).not.toHaveBeenCalled()
        })
    })
})
