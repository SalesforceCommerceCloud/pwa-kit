/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Connector from './connector'

// We are mocking the console outputs because we are testing debug information is outputting
// but this makes the terminal screen really noisy. Below is a toggle to see console output
const showOutput = true

const projectSlug = 'test'
const displayName = 'Test'

const consoleWarn = window.console.warn
const consoleInfo = window.console.info
const consoleLog = window.console.log

// Mocking the console object
const wrapOutputWithJest = (originalFn) => {
    return jest.fn((...args) => {
        if (showOutput) {
            originalFn.apply(this, args)
        }
    })
}

// Make sure we have a clean call queue every test
const mockConsoleOutput = () => {
    window.console.warn = wrapOutputWithJest(consoleWarn)
    window.console.info = wrapOutputWithJest(consoleInfo)
    window.console.log = wrapOutputWithJest(consoleLog)
}

// The bridge function that binds the required in Sandy to window and manually runs
// the script's onload function
// This is required because jest/jsDom made external resource loading impossible
// and we don't want our unit test to depend on network request
const mockScriptReady = (scriptSrc) => {
    document.querySelectorAll(`[src*="${scriptSrc}"]`)[0].onload()
}

describe('Connector', () => {
    beforeEach(() => {
        // Clean all scripts
        ;[...document.getElementsByTagName('script')].forEach((script) => {
            document.body.removeChild(script)
        })

        mockConsoleOutput()

        // Append first script tag
        const el = document.createElement('script')
        el.src = `/scripts/first.js`
        document.body.appendChild(el)
    })

    test('loads script', (done) => {
        const scriptSrc = 'testing.js'

        Connector.loadScript(scriptSrc, {
            ready: () => {
                done()
            }
        })

        mockScriptReady(scriptSrc)
    })

    test('does not load same script more than once but invokes the ready function on the bounded objects', (done) => {
        const scriptSrc = 'http://localhost/test.js'
        let ready1 = false
        let ready2 = false
        let callCount = 0

        Connector.loadScript(scriptSrc, {
            ready: () => {
                callCount++
                ready1 = true
                if (ready1 && ready2) {
                    expect(callCount).toBe(2)
                    done()
                }
            }
        })
        mockScriptReady(scriptSrc)

        Connector.loadScript(scriptSrc, {
            ready: () => {
                callCount++
                ready2 = true
                if (ready1 && ready2) {
                    expect(callCount).toBe(2)
                    done()
                }
            }
        })
        mockScriptReady(scriptSrc)

        const scripts = document.getElementsByTagName('script')
        expect(scripts.length).toBe(2)
        expect(scripts[0].src).toBe(scriptSrc)
    })

    test('invokes the ready functions of the same script regardless of race condition', (done) => {
        const scriptSrc = 'http://localhost/test.js'
        let ready1 = false
        let ready2 = false
        let callCount = 0

        Connector.loadScript(scriptSrc, {
            ready: () => {
                callCount++
                ready1 = true
                if (ready1 && ready2) {
                    expect(callCount).toBe(2)
                    done()
                }
            }
        })

        Connector.loadScript(scriptSrc, {
            ready: () => {
                callCount++
                ready2 = true
                if (ready1 && ready2) {
                    expect(callCount).toBe(2)
                    done()
                }
            }
        })
        mockScriptReady(scriptSrc)

        const scripts = document.getElementsByTagName('script')
        expect(scripts.length).toBe(2)
        expect(scripts[0].src).toBe(scriptSrc)
    })

    test('debugHeading function returns a styled console output arguments', () => {
        const outputArgs = Connector.debugHeading('Test', 'event')

        expect(outputArgs[2]).toBe('Test')
        expect(outputArgs[5]).toBe('event')
    })

    test('initializes', () => {
        const connector = new Connector()

        expect(connector).toBeDefined()
        expect(connector.name).toBe('Connector')
        expect(connector.displayName).toBe('Connector')
        expect(connector.q.length).toBe(0)
        expect(connector.options.debug).toBe(false)
    })

    test('sets display name on initialize', () => {
        const connector = new Connector(displayName)

        expect(connector).toBeDefined()
        expect(connector.name).toBe('Test')
        expect(connector.displayName).toBe('Test')
        expect(connector.q.length).toBe(0)
    })

    test('sets options', () => {
        const connector = new Connector(displayName, {
            projectSlug,
            debug: true
        })

        expect(connector.options).toBeDefined()
        expect(connector.options.projectSlug).toBe(projectSlug)
        expect(connector.options.debug).toBe(true)
    })

    test('drains queue when ready is called', () => {
        const templateName = 'template'
        const connector = new Connector()

        connector.pageviewEvent = jest.fn()
        connector.send = jest.fn()

        connector.receive('pageview', {templateName})
        connector.receive('pageview', {templateName})

        expect(connector.q.length).toBe(2)

        connector.ready()

        expect(connector.isReady).toBe(true)
        expect(connector.q.length).toBe(0)
    })

    test('calls respective event functions when it receives events', () => {
        const templateName = 'template'
        const connector = new Connector()

        connector.pageviewEvent = jest.fn((arg) => {
            return {
                pageview: arg
            }
        })
        connector.purchaseEvent = jest.fn((arg) => {
            return {
                purchase: arg
            }
        })
        connector.send = jest.fn()

        connector.ready()

        connector.receive('pageview', {templateName})
        connector.receive('purchase', {templateName})

        expect(connector.pageviewEvent.mock.calls.length).toBe(1)
        expect(connector.pageviewEvent.mock.calls).toEqual([[{templateName}, undefined]])
        expect(connector.purchaseEvent.mock.calls.length).toBe(1)
        expect(connector.purchaseEvent.mock.calls).toEqual([[{templateName}, undefined]])
        expect(connector.send.mock.calls.length).toBe(2)
        expect(connector.send.mock.calls).toEqual([
            ['pageview', {pageview: {templateName}}],
            ['purchase', {purchase: {templateName}}]
        ])
    })

    test('outputs debug information when in debug mode', () => {
        const templateName = 'template'
        const connector = new Connector(displayName, {
            projectSlug,
            debug: true
        })

        connector.pageviewEvent = () => {
            return 'test'
        }
        connector.purchaseEvent = jest.fn()

        connector.ready()
        connector.receive('pageview', {templateName})

        expect(window.console.log.mock.calls.length).toBe(1)
    })

    test('send does not get called if type is invalid', () => {
        const connector = new Connector(displayName, {
            projectSlug,
            debug: true
        })

        connector.send = jest.fn()

        connector.ready()
        connector.receive('ready')

        expect(connector.send.mock.calls.length).toBe(0)
    })

    test('optional events does not throw nor send', () => {
        const connector = new Connector(displayName, {
            projectSlug,
            debug: true
        })

        connector.send = jest.fn()

        connector.ready()
        connector.receive('addToCart')
        connector.receive('removeFromCart')
        connector.receive('addToWishlist')
        connector.receive('removeFromWishlist')
        connector.receive('uiInteraction')
        connector.receive('performance')
        connector.receive('setCurrency')
        connector.receive('pageview')
        connector.receive('purchase')
        connector.receive('launchedFromHomeScreenEvent')

        expect(connector.send.mock.calls.length).toBe(0)
    })
})
