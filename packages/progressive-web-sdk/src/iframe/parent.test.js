/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {DEFAULT_EVENTS} from './common'
import FrameBridge from './parent'
import Queue from '../../vendor/queue.src.js'
import {createMockEvent} from './test-utils'

let frame

beforeEach(() => {
    frame = new FrameBridge({
        origin: 'about:blank' // default is window.location.origin, which is null
    })

    // eslint-disable-next-line no-undef
    jsdom.reconfigure({
        url: 'about:blank'
    })
})

afterEach(() => {
    // Make sure the saved instance is deleted
    delete window.Progressive.FrameBridge
})

test('is created only once with its constructor, even if called multiple times', () => {
    expect(window.Progressive.FrameBridge).toBeDefined()
    expect(frame.isReady).toBe(false)
    expect(Object.keys(frame.listeners)).toContain(
        DEFAULT_EVENTS.CHILD_READY,
        DEFAULT_EVENTS.CHILD_NAVIGATING
    )
    expect(frame.eventQueue instanceof Queue).toBe(true)

    expect(new FrameBridge()).toBe(frame)
})

test('creates an iframe with the correct attributes', () => {
    const iframe = frame.childFrame

    expect(iframe.style.display).toBe('none')
    expect(iframe.getAttribute('src')).toBe('about:blank')
    expect(iframe.getAttribute('style')).toBe('display: none;')
    expect(iframe.getAttribute('id')).toBe('progressive-frame-bridge')
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin allow-forms')
})

test('trigger adds events to the eventQueue if child is not ready', () => {
    frame.trigger('foo')
    expect(frame.eventQueue.getLength()).toBe(1)
    expect(frame.eventQueue.peek().eventName).toBe('foo')

    frame.trigger('bar')
    expect(frame.eventQueue.getLength()).toBe(2)
})

describe('with the _sendMessage method mocked', () => {
    let _sendMessageMock

    beforeEach(() => {
        _sendMessageMock = jest.fn()
        frame._sendMessage = _sendMessageMock
    })

    test('_drainQueue empties the queue and sends a message for each', () => {
        frame.trigger('foo')
        frame.trigger('bar')

        frame._drainQueue()
        expect(_sendMessageMock).toHaveBeenCalledTimes(2)
    })

    test('multiple navigation events in the queue and calling _drainQueue', () => {
        frame.navigate('/somewhere-1')
        frame.trigger('someEvent')
        frame.navigate('/somewhere-2')
        frame.trigger('someEvent')
        frame.navigate('/somewhere-3')
        frame.trigger('a')
        frame.trigger('b')
        frame.trigger('c')

        frame._drainQueue()

        // Once only for the very last navigation
        expect(_sendMessageMock).toHaveBeenCalledTimes(1)

        expect(frame.eventQueue.peek().eventName).toBe('a')
        expect(frame.eventQueue.getLength()).toBe(3)
    })

    test('_childReadyHandler sets FrameBridge to ready', () => {
        frame._childReadyHandler()
        expect(frame.isReady).toBe(true)
    })

    test('__bindChildFrameWindowToSendMessage binds _sendMessage with childFrame window', () => {
        frame._bindChildFrameWindowToSendMessage()
        frame._sendMessage('foo')
        expect(_sendMessageMock).toBeCalledWith(frame.childFrame.contentWindow, 'foo')
    })
})

test('uid returns a counter that increases by 1 every time it is called', () => {
    for (let i = 0; i < 10; i++) {
        expect(frame.uid()).toBe(i)
    }
})

test('_isSameOrigin rejects or passes events based on their origin and source', () => {
    // We need to mock the event objects, since postMessage via JSDOM doesn't
    // actually implement these properties
    const passEvent = {
        origin: 'about:blank',
        source: frame.childFrame.contentWindow
    }
    const failEvent = {
        origin: 'http://www.bar.com',
        source: null
    }
    const wrongSource = {
        origin: 'about:blank',
        source: window
    }
    const wrongOrigin = {
        origin: 'http://www.foo.com',
        source: frame.childFrame.contentWindow
    }

    expect(frame._isSameOrigin(passEvent)).toBe(true)
    expect(frame._isSameOrigin(failEvent)).toBe(false)
    expect(frame._isSameOrigin(wrongSource)).toBe(false)
    expect(frame._isSameOrigin(wrongOrigin)).toBe(false)
})

test('trigger calls the Frame prototype trigger method if the FrameBridge is ready', () => {
    frame._childReadyHandler()

    const foo = 'foo'
    const mockMessage = jest.fn()
    frame.childFrame.contentWindow.postMessage = mockMessage

    frame.trigger(foo)

    expect(mockMessage).toBeCalledWith(createMockEvent(foo), 'about:blank')
})

const testQuickNavigation = (absoluteUrl) => {
    frame.navigate(absoluteUrl)
    // We force navigate to an empty page first
    expect(frame.childFrame.contentWindow.location.href).toBe('about:blank')
    setTimeout(() => {
        // And then finally navigate to the target url
        expect(frame.childFrame.contentWindow.location.href).toBe(absoluteUrl)
    })

    // Verify the redundant navigation event in the queue
    expect(frame.eventQueue.peek().eventName).toBe(DEFAULT_EVENTS.NAVIGATE)
}

test('quick navigation when FrameBridge is either ready or not', () => {
    testQuickNavigation('http://www.foobar.com/')

    frame._navigateHandler()
    expect(frame.isReady).toBe(false)

    testQuickNavigation('http://www.foobar2.com/')
})

describe('with the trigger and on methods mocked', () => {
    let mockTrigger
    let mockOn

    beforeEach(() => {
        mockTrigger = jest.fn()
        frame.trigger = mockTrigger

        mockOn = jest.fn((event, callback) => {
            callback(event)
        })
        frame.on = mockOn
    })

    test('trigger is called with the correct arguments by navigate', () => {
        const URL = 'http://foo.com'
        frame.navigate(URL)
        expect(mockTrigger).toBeCalledWith(DEFAULT_EVENTS.NAVIGATE, {url: URL})
    })

    test('the callMethod triggers a postMessage to the child, and listens for postMessages from child', () => {
        return frame.callMethod('foo', 1, 2).then((event) => {
            // Ensure arguments are passed correctly to the child frame
            expect(mockTrigger).toBeCalledWith(DEFAULT_EVENTS.RPC_CALL, {
                uid: 0,
                fnName: 'foo',
                args: [1, 2]
            })

            // Ensure that we registered a listener with the right name
            expect(mockOn.mock.calls[0]).toContain(`${DEFAULT_EVENTS.RPC_CALL}:0`)
            // Ensure that the anonymous function that resolves the promise
            // is also added
            expect(typeof mockOn.mock.calls[0][1]).toBe('function')

            // While we mocked .on, the anonymous function that's added when
            // we call callMethod is still run, and resolves the promise
            // Ensure that the return value matches what we expect
            expect(event.data).toBe(`${DEFAULT_EVENTS.RPC_CALL}:0`)
        })
    })
})
