/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

jest.mock('./ask-frame')
const AskFrame = require('./ask-frame').default
jest.mock('../../utils/messaging-state')
const updateState = require('../../utils/messaging-state').updateState

import {handleNotificationClick, initMessaging} from './index'

describe('handleNotificationClick', () => {
    const defaultHref = 'http://www.bar.com'

    // The following modification of window.location.href is to
    // allow handleNotificationClick() to modify window.location.href
    const windowLocation = JSON.stringify(window.location)
    delete window.location
    Object.defineProperty(window, 'location', {
        value: JSON.parse(windowLocation)
    })

    beforeEach(() => {
        window.location.href = defaultHref
    })

    test('modifies window.location.href with the given url', () => {
        const url = 'https://www.merlinspotions.com/'
        const event = {
            detail: {
                url
            }
        }

        handleNotificationClick(event)

        expect(window.location.href).toEqual(url)
    })

    test('does not modify window.location.href when url is invalid', () => {
        handleNotificationClick({})
        handleNotificationClick({foo: 'bar'})
        handleNotificationClick({detail: 'foo'})
        handleNotificationClick({
            detail: {
                url: undefined
            }
        })
        handleNotificationClick({
            detail: {
                url: ''
            }
        })

        expect(window.location.href).toEqual(defaultHref)
    })
})

describe('initMessaging', () => {
    const mockState = {
        canSubscribe: true,
        channels: [],
        subscribed: false,
        isSubscribed: false,
        pageCount: 1,
        visitCountdowns: {},
        showOnPageCount: 3
    }

    const mockConfiguration = {
        defaultAsk: {
            html: '<html><head></head><body></body></html>',
            auto: true
        }
    }

    beforeEach(() => {
        updateState.mockReturnValue({
            pageCount: 1,
            visitCountdowns: {}
        })

        window.Progressive = {
            MessagingClientInitPromise: jest.fn().mockReturnValue(Promise.resolve(mockState))()
        }
        window.Mobify = {
            WebPush: {
                PWAClient: {
                    register: jest.fn(),
                    Events: {
                        notificationClick: jest.fn()
                    }
                }
            }
        }
    })

    test('carries out initialization when MessagingClientInitPromise resolves', () => {
        return initMessaging(mockConfiguration).then(({askFrame, currentSubscriptionState}) => {
            expect(window.Mobify.WebPush.PWAClient.register.mock.calls[0]).toEqual([
                handleNotificationClick,
                window.Mobify.WebPush.PWAClient.Events.notificationClick
            ])
            expect(updateState.mock.calls.length).toBe(1)
            expect(askFrame instanceof AskFrame).toBeTruthy()
            expect(askFrame.create.mock.calls.length).toBe(0)
            expect(askFrame.setupListeners.mock.calls.length).toBe(0)
            expect(askFrame.show.mock.calls.length).toBe(0)
            expect(currentSubscriptionState).toEqual(mockState)
        })
    })

    test('calls create, setupListeners, and show on the askFrame object if eligible to show soft ask', () => {
        // Mock return a Messaging Client state where the current page count
        // matches the `showOnPageCount` setting
        updateState.mockReturnValue({
            pageCount: 3,
            visitCountdowns: {}
        })

        return initMessaging(mockConfiguration).then(({askFrame}) => {
            expect(askFrame.create.mock.calls.length).toBe(1)
            expect(askFrame.setupListeners.mock.calls.length).toBe(1)
            expect(askFrame.show.mock.calls.length).toBe(1)
        })
    })
})
