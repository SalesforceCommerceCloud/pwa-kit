/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {DEFAULT_EVENTS} from './common'
import ChildFrame from './child'
import {createMockEvent} from './test-utils'

const ORIGIN = 'http://www.foo.com/'
const realPostMessage = global.postMessage

describe('ChildFrame', () => {
    let frame
    beforeEach(() => {
        frame = new ChildFrame({
            origin: ORIGIN
        })
    })

    afterEach(() => {
        // Make sure the saved instance is deleted
        delete window.Progressive.ChildFrame

        global.postMessage = realPostMessage
    })

    test('can be created with its constructor and initializes on window.onload', () => {
        let loadCallback = (resolve) => resolve()

        return new Promise((resolve) => {
            loadCallback = loadCallback.bind(this, resolve)
            window.addEventListener('DOMContentLoaded', loadCallback)

            // Dispatch our own, mocked DOMContentLoaded event
            const event = new window.Event('DOMContentLoaded', {bubbles: true})
            document.dispatchEvent(event)
        }).then(() => {
            window.removeEventListener('DOMContentLoaded', loadCallback)
            expect(Object.keys(frame.listeners)).toContain(
                DEFAULT_EVENTS.NAVIGATE,
                DEFAULT_EVENTS.RPC_CALL
            )
            expect(window.Progressive.ChildFrame).toBeDefined()
        })
    })

    test.only('calls window.location.replace when navigate is called', () => {
        global.jsdom.reconfigure({
            url: 'http://www.bar.com/'
        })
        window.location.replace = jest.fn()
        const mockMessage = jest.fn()
        global.postMessage = mockMessage

        // Shouldn't navigate when provided url is the same as href
        frame._navigateHandler({url: window.location.href})
        expect(window.location.replace).not.toBeCalled()
        // But should re-trigger this event
        expect(mockMessage).toBeCalledWith(createMockEvent(DEFAULT_EVENTS.CHILD_READY), ORIGIN)

        // Should set the href to the provided url
        frame._navigateHandler({url: 'http://www.foo.com/'})
        expect(mockMessage).toBeCalledWith(createMockEvent(DEFAULT_EVENTS.CHILD_NAVIGATING), ORIGIN)
        expect(window.location.replace).toBeCalledWith('http://www.foo.com/')
    })

    test('registers methods through the registerMethod function', () => {
        const foo = 'foo'
        const fooMethod = (a, b) => a + b

        frame.registerMethod(foo, fooMethod)

        expect(frame.rpcMethods[foo]).toBe(fooMethod)
    })

    test('registered RPC methods can be called from the parent', () => {
        const uid = 0
        const mockMessage = jest.fn()
        global.postMessage = mockMessage

        const foo = 'foo'
        const fooMethod = (a, b) => a + b

        frame.registerMethod(foo, fooMethod)

        return frame
            ._rpcHandler({
                uid,
                fnName: 'foo',
                args: [1, 2]
            })
            .then(() => {
                expect(mockMessage).toBeCalledWith(
                    createMockEvent(`${DEFAULT_EVENTS.RPC_CALL}:${uid}`, 3),
                    ORIGIN
                )
            })
    })

    test("_rpcHandler doesn't do anything when the requested method does not exist", () => {
        const uid = 1

        // Mock out console.warn so we can tell if it was called
        const mockConsole = jest.fn()
        const _consoleWarn = console.warn
        console.warn = mockConsole

        frame.options.debug = true

        frame._rpcHandler({
            uid,
            fnName: 'baz',
            args: [1, 2]
        })

        frame.options.debug = false

        expect(mockConsole).toBeCalledWith('[Child] unregistered method called:', 'baz')
        console.warn = _consoleWarn
    })

    test('subsequent calls to constructor return window.Progressive.ChildFrame instance', () => {
        expect(window.Progressive.ChildFrame).toBeDefined()

        expect(frame).toBe(window.Progressive.ChildFrame)
    })

    test('_isSameOrigin rejects or passes events based on their origin and source', () => {
        const source = window

        // We need to mock the event objects, since postMessage via JSDOM doesn't
        // actually implement these properties
        const passEvent = {
            origin: ORIGIN,
            source
        }
        const failEvent = {
            origin: 'http://www.bar.com/',
            source
        }

        expect(frame._isSameOrigin(passEvent)).toBe(true)
        expect(frame._isSameOrigin(failEvent)).toBe(false)
    })

    test('raises the CHILD_READY event if ChildFrame is created after DOMContentLoaded', (done) => {
        if (window.Progressive.ChildFrame) {
            delete window.Progressive.ChildFrame
        }

        const mockMessage = jest.fn(() => {
            done()
        })
        global.postMessage = mockMessage

        Object.defineProperty(document, 'readyState', {
            get() {
                return 'interactive'
            }
        })

        frame = new ChildFrame({origin: ORIGIN})
        expect(frame).toBeDefined()

        expect(mockMessage).toBeCalledWith(createMockEvent(DEFAULT_EVENTS.CHILD_READY), ORIGIN)
    })
})
