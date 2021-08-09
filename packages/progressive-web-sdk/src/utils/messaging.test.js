/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {
    shouldAsk,
    isSubscribedToChannel,
    isMessagingSupported,
    createGlobalMessagingClientInitPromise,
    loadAndInitMessagingClient,
    testResetClientInit
} from './messaging'
import * as constants from '../store/push-messaging/constants'

import sinon from 'sinon'
const sandbox = sinon.sandbox.create()
afterEach(() => sandbox.restore())

const emptyPromise = () => new Promise((resolve) => resolve())

describe('shouldAsk method', () => {
    const logger = {}
    let shouldAskMethod

    const defaultProps = {
        visitCountdowns: {},
        canSubscribe: false,
        channels: [],
        isSubscribed: false,
        pageCount: 1,
        deferOnDismissal: 3,
        showOnPageCount: 3
    }

    beforeEach(() => {
        logger.log = jest.fn()
        shouldAskMethod = shouldAsk.bind(this, logger)
    })

    test('returns false if `canSubscribe` is false', () => {
        const result = shouldAskMethod(defaultProps)
        expect(logger.log.mock.calls[0][0]).toEqual(
            'Should not ask : Unable to subscribe. Messaging Client is not ready or notification permissions are blocked'
        )
        expect(result).toBe(false)
    })

    test('returns false if `visitCountdown` for `channelName` is > 0', () => {
        const props = {
            ...defaultProps,
            canSubscribe: true,
            visitCountdowns: {
                bar: 3
            },
            channelName: 'bar'
        }
        const result = shouldAskMethod(props)
        expect(logger.log.mock.calls[0][0]).toEqual(
            'Should not ask for channel bar: Deferred until 3 more visit(s)'
        )
        expect(result).toBe(false)
    })

    test('returns false if pageCount % showOnPageCount is greater than 0', () => {
        const props = {
            ...defaultProps,
            canSubscribe: true
        }
        const result = shouldAskMethod(props)
        expect(logger.log.mock.calls[0][0]).toEqual(
            'Should not ask : Waiting for 2 more page visit(s)'
        )
        expect(result).toBe(false)
    })

    test('returns false when already subscribed to this channel', () => {
        const props = {
            ...defaultProps,
            canSubscribe: true,
            isSubscribed: true,
            channels: [constants.DEFAULT_CHANNEL, 'bar']
        }
        const result = shouldAskMethod(props)
        expect(logger.log.mock.calls[0][0]).toEqual('Should not ask : Already subscribed')
        expect(result).toBe(false)
    })

    test('returns true if all conditions are met', () => {
        const props = {
            ...defaultProps,
            canSubscribe: true,
            isSubscribed: true,
            channels: [constants.DEFAULT_CHANNEL],
            channelName: 'bar',
            showOnPageCount: 3,
            pageCount: 3,
            visitCountdowns: {
                'new-deals': 4
            }
        }
        const result = shouldAskMethod(props)
        expect(logger.log.mock.calls[0]).toEqual(['Can ask', 'for channel bar'])
        expect(result).toBe(true)
    })

    test('ignores pageCount changes if alreadyShown is true', () => {
        const props = {
            ...defaultProps,
            canSubscribe: true,
            showOnPageCount: 2,
            pageCount: 3
        }
        const result = shouldAskMethod(props, true)
        expect(result).toBe(true)
    })

    test('returns false when pageCount is insufficient, when alreadyShown is false', () => {
        const props = {
            ...defaultProps,
            canSubscribe: true,
            showOnPageCount: 4,
            pageCount: 3
        }
        const result = shouldAskMethod(props, false)
        expect(logger.log.mock.calls[0][0]).toEqual(
            'Should not ask : Waiting for 1 more page visit(s)'
        )
        expect(result).toBe(false)
    })
})

describe('isSubscribedToChannel method', () => {
    test('returns true if no channel name is provided', () => {
        expect(isSubscribedToChannel(true, ['channel1', 'channel2'])).toBe(true)
    })

    test('returns true if the given channel name exists in channels array', () => {
        expect(isSubscribedToChannel(true, ['channel1', 'channel2'], 'channel1')).toBe(true)
    })

    test('returns false if isSubscribed is false', () => {
        expect(isSubscribedToChannel(false, ['channel1', 'channel2'], 'channel1')).toBe(false)
    })

    test('returns false if channel name does not exist in channels array', () => {
        expect(isSubscribedToChannel(true, ['channel1', 'channel2'], 'channel3')).toBe(false)
    })
})

describe('isMessagingSupported function', () => {
    let windowProgressive
    beforeEach(() => {
        windowProgressive = window.Progressive
        window.Progressive = {}
    })
    afterEach(() => {
        window.Progressive = windowProgressive
    })
    test('returns true only when messaging is enabled and supported', () => {
        window.Progressive = null
        expect(isMessagingSupported()).toBe(false)
        window.Progressive = {}
        expect(isMessagingSupported()).toBe(false)
        window.Progressive.Messaging = {}
        expect(isMessagingSupported()).toBe(false)
        window.Progressive.Messaging.enabled = true
        expect(isMessagingSupported()).toBe(false)
        window.Progressive.Messaging.supported = true
        expect(isMessagingSupported()).toBe(true)
    })
})

describe('createGlobalMessagingClientInitPromise function', () => {
    beforeEach(() => {
        window.Progressive = {}
    })

    afterEach(() => {
        delete window.Progressive

        // Ensure the effects of other tests do not influence these tests
        testResetClientInit()
    })

    test('window.Progressive.MessagingClientInitPromise return undefined', () => {
        createGlobalMessagingClientInitPromise(false)
        expect(window.Progressive.MessagingClientInitPromise).toBe(undefined)
    })

    test('window.Progressive.MessagingClientInitPromise return promise', () => {
        const mock = emptyPromise()
        window.Progressive.MessagingClientInitPromise = mock

        createGlobalMessagingClientInitPromise(false)
        expect(typeof window.Progressive.MessagingClientInitPromise.then).toBe('function')

        createGlobalMessagingClientInitPromise(true)
        expect(typeof window.Progressive.MessagingClientInitPromise.then).toBe('function')
    })

    test('window.Progressive.MessagingClientInitPromise not set and function return true', () => {
        expect(window.Progressive.MessagingClientInitPromise).toBe(undefined)
        createGlobalMessagingClientInitPromise(true)
        expect(typeof window.Progressive.MessagingClientInitPromise.then).toBe('function')
    })
})

describe('loadAndInitMessagingClient function', () => {
    let fakeInit
    let fakeScriptElement
    let fakeConsoleLog
    const originalConsoleError = console.error
    const headElement = document.getElementsByTagName('head')[0]

    beforeEach(() => {
        jest.useFakeTimers()

        // Setup mock objects and functions
        fakeInit = jest.fn()
        fakeConsoleLog = jest.fn()
        fakeScriptElement = {
            id: null,
            src: null,
            async: null,
            charset: null,
            onload: null,
            onerror: null,
            dataset: {}
        }

        // Set stub window objects and functions
        window.Progressive = {}
        window.Progressive.MessagingClient = {
            init: fakeInit.mockReturnValue(Promise.resolve())
        }

        // Mock out createElement and body.appendChild so that we don't have
        // to fetch an actual script
        sandbox.stub(document, 'createElement').returns(fakeScriptElement)
        sandbox.stub(headElement, 'appendChild')

        // If you need to actually see the error logging from this module,
        // uncomment the following line (tests won't be affected):
        //
        //   fakeConsoleLog = jest.fn((args) => originalConsoleError(args))
        //
        console.error = fakeConsoleLog
    })

    afterEach(() => {
        jest.runAllTimers() // runs setTimeout
        delete window.Progressive
        sandbox.restore()
        console.error = originalConsoleError

        // Ensure the effects of other tests do not influence these tests
        testResetClientInit()
    })

    test('triggers a console.error if createGlobalMessagingClientInitPromise() was not called first', () => {
        expect(fakeConsoleLog).not.toBeCalled()
        loadAndInitMessagingClient() // This instantiates an internal promise
        fakeScriptElement.onload() // This will resolve that internal promise
        setTimeout(expect(fakeConsoleLog).toBeCalled, 1)
    })

    test('no console.err if createGlobalMessagingClientInitPromise() was called first', () => {
        // This function must be run first to guarantee that `clientInitResolver`
        // has a proper resolver
        createGlobalMessagingClientInitPromise(true)

        expect(fakeConsoleLog).not.toBeCalled()
        loadAndInitMessagingClient() // This instantiates an internal promise
        fakeScriptElement.onload() // This will resolve that internal promise
        setTimeout(expect(fakeConsoleLog).not.toBeCalled, 1)
    })

    test('triggers a call to window.Progressive.MessagingClient.init()', () => {
        // This function must be run first to guarantee that `clientInitResolver`
        // has a proper resolver
        createGlobalMessagingClientInitPromise(true)

        expect(fakeInit).not.toBeCalled()
        loadAndInitMessagingClient() // This instantiates an internal promise
        fakeScriptElement.onload() // This will resolve that internal promise
        setTimeout(expect(fakeInit).toBeCalled, 1)
    })

    test('returns a promise', () => {
        // This function must be run first to guarantee that `clientInitResolver`
        // has a proper resolver
        createGlobalMessagingClientInitPromise(true)

        const promise = loadAndInitMessagingClient()
        expect(typeof promise.then).toBe('function')
    })

    test('returns window.Progressive.MessagingClientInitPromise', () => {
        const mock = 'mock'
        window.Progressive.MessagingClientInitPromise = mock

        // This function must be run first to guarantee that `clientInitResolver`
        // has a proper resolver
        createGlobalMessagingClientInitPromise(true)

        const returned = loadAndInitMessagingClient()
        expect(returned).toBe(mock)
    })
})
