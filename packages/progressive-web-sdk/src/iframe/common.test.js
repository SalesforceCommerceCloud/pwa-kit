/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {Frame, parseEventData, KEY_IS_MOBIFY, VALUE_IS_MOBIFY} from './common'
import {createMockEvent} from './test-utils'

const EVENT_NAME = 'foo'
const EVENT = {
    data: createMockEvent(EVENT_NAME)
}
const _consoleInfo = console.info
const _postMessage = global.postMessage

afterEach(() => {
    window.Progressive = {}

    // Ensure we set these back to their original values, even if tests fails
    console.info = _consoleInfo
    global.postMessage = _postMessage
})

test('on registers the given method under the given event name', () => {
    const frame = new Frame()
    const foo = jest.fn()
    const foo2 = jest.fn()

    frame.on(EVENT_NAME, foo)
    frame.on(EVENT_NAME, foo2)

    expect(frame.listeners[EVENT_NAME].length).toBe(2)
    expect(frame.listeners[EVENT_NAME][0]).toBe(foo)
    expect(frame.listeners[EVENT_NAME][1]).toBe(foo2)
})

describe('Unsubscribing from events', () => {
    let frame
    let handler1
    let handler2

    beforeEach(() => {
        frame = new Frame()

        handler1 = jest.fn()
        handler2 = jest.fn()

        frame.on(EVENT_NAME, handler1)
        frame.on(EVENT_NAME, handler2)
    })

    test('off unregisters the given method for the given event', () => {
        frame.off(EVENT_NAME, handler1)
        expect(frame.listeners[EVENT_NAME].length).toBe(1)
    })

    test('off cleans up empty event listener array when last handler unsubscribed', () => {
        frame.off(EVENT_NAME, handler1)
        frame.off(EVENT_NAME, handler2)
        expect(frame.listeners[EVENT_NAME]).toBeUndefined()
    })
})

describe('parseEventData', () => {
    test("returns false if the data isn't a string", () => {
        const mockData = false
        expect(parseEventData(mockData)).toBe(false)
    })

    test('returns false if theres a problem parsing the JSON object', () => {
        const mockData = 'hello world'
        expect(parseEventData(mockData)).toBe(false)
    })

    test(`returns false if the event data doesn't have ${KEY_IS_MOBIFY} set`, () => {
        const mockData = '{"data":"hello"}'
        expect(parseEventData(mockData)).toBe(false)
    })

    test('returns the parsed data object if everything went well', () => {
        const mockData = createMockEvent('foo', 42)

        expect(parseEventData(mockData)).toEqual({
            eventName: 'foo',
            data: 42,
            [KEY_IS_MOBIFY]: VALUE_IS_MOBIFY
        })
    })
})

describe('eventReceived', () => {
    test('calls all listeners registered for an event', () => {
        const frame = new Frame()

        expect(frame.listeners).toEqual({})

        const foo = jest.fn()
        const foo2 = jest.fn()
        const bar = jest.fn()

        frame.on(EVENT_NAME, foo)
        frame.on(EVENT_NAME, foo2)

        frame._eventReceived(() => true, EVENT)
        expect(foo).toHaveBeenCalledTimes(1)
        expect(foo2).toHaveBeenCalledTimes(1)
        expect(bar).not.toBeCalled()
    })

    test("doesn't call listeners if the provided condition is not met", () => {
        const frame = new Frame()
        const foo = jest.fn()

        frame.on(EVENT_NAME, foo)
        frame._eventReceived(() => false, EVENT)
        expect(foo).not.toBeCalled()
    })

    test("doesn't call listeners if the event isn't from FrameBridge", () => {
        const frame = new Frame()
        const foo = jest.fn()
        const nonBridgeEvent = {
            data: JSON.stringify({
                eventName: EVENT_NAME,
                data: {
                    hello: 'world'
                }
            })
        }

        frame.on(EVENT_NAME, foo)
        frame._eventReceived(() => true, nonBridgeEvent)
        expect(foo).not.toBeCalled()
    })

    test('handles case where no listeners have been registered for the event', () => {
        const frame = new Frame({debug: true})

        // Mock out console.info so we can tell if it was called
        const mockConsole = jest.fn()
        console.info = mockConsole

        frame._eventReceived(() => true, EVENT)

        expect(mockConsole).toBeCalledWith('no listener registered for event', EVENT_NAME)
    })
})

describe('log', () => {
    let mockConsole

    beforeEach(() => {
        mockConsole = jest.fn()
        console.info = mockConsole
    })

    test('logs to console if debug is enabled', () => {
        const frame = new Frame({debug: true})

        frame._log('', 'Hello', 'World')

        expect(mockConsole).toBeCalledWith('', 'Hello', 'World')
    })

    test("doesn't log to console if debug is disabled", () => {
        const frame = new Frame()

        frame._log('Hello', 'World')

        expect(mockConsole).not.toBeCalled()
    })
})

test('sendMessage sends a message using postMessage', () => {
    const origin = 'test'
    const frame = new Frame({
        origin
    })

    const mockMessage = jest.fn()
    global.postMessage = mockMessage

    frame._sendMessage(global, EVENT_NAME, EVENT)

    expect(mockMessage).toBeCalledWith(createMockEvent(EVENT_NAME, EVENT), origin)
})
