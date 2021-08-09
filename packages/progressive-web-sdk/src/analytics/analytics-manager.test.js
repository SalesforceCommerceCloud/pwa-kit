/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Connector from './connectors/connector'
import analyticsManager from './analytics-manager'

jest.useFakeTimers()

const initOptions = {
    projectSlug: 'progressive-web-sdk',
    mobifyGAID: 'test',
    ecommerceLibrary: 'ec'
}

// We are mocking the console outputs because we are testing debug information is outputting
// but this makes the terminal screen really noisy. Below is a toggle to see console output
const showOutput = false

const consoleErr = window.console.error
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
    window.console.error = wrapOutputWithJest(consoleErr)
    window.console.warn = wrapOutputWithJest(consoleWarn)
    window.console.info = wrapOutputWithJest(consoleInfo)
    window.console.log = wrapOutputWithJest(consoleLog)

    // These functions don't exist in jsDom
    window.console.groupCollapsed = jest.fn()
    window.console.groupEnd = jest.fn()
}

class NewConnector1 extends Connector {
    constructor() {
        super('New Connector 1')

        this.init = jest.fn()
        this.pageviewEvent = jest.fn()
        this.purchaseEvent = jest.fn()
        this.send = jest.fn()
        this.receive = jest.fn()
    }
}
class ConnectorWithMissingOverloads extends Connector {
    constructor() {
        super('New Connector 2')

        this.pageviewEvent = jest.fn()
        this.purchaseEvent = jest.fn()
        this.send = jest.fn()
        this.receive = jest.fn()
    }
}
class ThrowingConnector extends Connector {
    constructor() {
        super('New Connector 3')

        this.errorCount = 0

        this.pageviewEvent = jest.fn()
        this.purchaseEvent = jest.fn()
        this.send = jest.fn(() => {
            throw 'test'
        })
        this.receive = jest.fn(() => {
            this.errorCount++

            // Ensure the receive function throws different errors
            if (this.errorCount % 2) {
                throw new Error('test')
            } else {
                throw 'test'
            }
        })
    }
}

const dispatchEvent = (el, eventName) => {
    const event = new MouseEvent(eventName, {
        view: window,
        bubbles: true,
        cancelable: true
    })

    el.dispatchEvent(event)
}

const simulateDomEvent = (eventName, analyticsName, tag, type, value, analyticsContent) => {
    const el = document.createElement(tag)

    if (analyticsName) {
        el.setAttribute('data-analytics-name', analyticsName)
    }

    if (analyticsContent) {
        el.setAttribute('data-analytics-content', analyticsContent)
    }

    if (type) {
        el.type = type
    }

    if (value) {
        el.value = value
    }

    document.getElementsByClassName('react-target')[0].appendChild(el)
    dispatchEvent(el, eventName)

    if (type === 'checkbox' || type === 'radio' || tag === 'button' || tag === 'div') {
        dispatchEvent(el, 'click')
    } else if (tag === 'select') {
        dispatchEvent(el, 'change')
    }

    return el
}

describe('Analytics Manager', () => {
    beforeEach(() => {
        ;[...document.getElementsByTagName('script')].forEach((script) => {
            document.body.removeChild(script)
        })

        window.Progressive = {}

        if (document.getElementsByClassName('react-target').length !== 0) {
            document.body.removeChild(document.getElementsByClassName('react-target')[0])
        }

        // Build react-target DOM element
        const reactRoot = document.createElement('div')
        reactRoot.className = 'react-target'
        document.body.appendChild(reactRoot)

        mockConsoleOutput()

        // clean up analyticsManager singleton instance
        analyticsManager.options = {
            debug: false
        }

        window.location.hash = ''

        const scriptel = document.createElement('script')
        scriptel.id = 'progressive-web-main'
        scriptel.src = '/test.js'
        document.body.appendChild(scriptel)
    })

    test('initialize all supplied analytics connectors', () => {
        const newConnector = new NewConnector1()

        analyticsManager.init(initOptions, newConnector)
        expect(newConnector.options.debug).toBe(false)

        const scripts = document.getElementsByTagName('script')
        expect(scripts[0].src).toBe('https://www.google-analytics.com/analytics.js')
        expect(scripts[1].src).toBe('http://localhost/test.js')
    })

    test('turns on debug mode when #MOBIFY_DEBUG is in url', () => {
        window.location.hash = '#MOBIFY_DEBUG'

        const newConnector = new NewConnector1()
        analyticsManager.init(initOptions, newConnector)

        expect(analyticsManager.options.debug).toBe(true)
        expect(newConnector.options.debug).toBe(true)

        const scripts = document.getElementsByTagName('script')
        expect(scripts[0].src).toBe('https://www.google-analytics.com/analytics_debug.js')
    })

    test('throws error when Mobify specific options are not provided', () => {
        expect(() => {
            analyticsManager.init(undefined)
        }).toThrow()
    })

    test('throws error when custom analytics connector is not an instance of Connector', () => {
        const newConnector = {}

        expect(() => {
            analyticsManager.init(
                {
                    projectSlug: 'progressive-web-sdk'
                },
                newConnector
            )
        }).toThrow()
    })

    test('distributes received event to all supplied analytics connectors', () => {
        const newConnector = new NewConnector1()

        analyticsManager.init(initOptions, newConnector)
        expect(newConnector.options.debug).toBe(false)

        analyticsManager.distribute('type', 'payload')
        expect(newConnector.receive).toHaveBeenCalled()
    })

    test("does not throw errors when the supplied custom analytics connector's receiver throws error", () => {
        const newConnector3 = new ThrowingConnector()
        const newConnector1 = new NewConnector1()

        expect(() => {
            analyticsManager.init(initOptions, newConnector3, newConnector1)

            analyticsManager.engagementEngine.receive = jest.fn()

            analyticsManager.distribute('type', 'payload')
        }).not.toThrow()

        analyticsManager.distribute('type2', 'payload2')
        expect(newConnector1.receive.mock.calls).toEqual([
            ['type', 'payload', undefined],
            ['type2', 'payload2', undefined]
        ])

        const errorCall = analyticsManager.engagementEngine.receive.mock.calls[1]
        expect(errorCall[0]).toEqual('uiInteraction')
        expect(errorCall[1].subject).toEqual('app')
        expect(errorCall[1].action).toEqual('Receive')
        expect(errorCall[1].object).toEqual('Error')
        expect(errorCall[1].name).toEqual('Analytics Connector Error: New Connector 3 - type')
    })

    test('all supplied custom analytics connector receives all analytics events when not namespaced', () => {
        const newConnector1 = new NewConnector1()
        const newConnector2 = new ConnectorWithMissingOverloads()

        analyticsManager.init(initOptions, newConnector1, newConnector2)
        analyticsManager.distribute('type', 'payload')
        analyticsManager.distribute('type2', 'payload2')

        expect(newConnector1.receive.mock.calls).toEqual([
            ['type', 'payload', undefined],
            ['type2', 'payload2', undefined]
        ])
        expect(newConnector2.receive.mock.calls).toEqual([
            ['type', 'payload', undefined],
            ['type2', 'payload2', undefined]
        ])
    })

    test('all supplied custom analytics connector receives analytics events that are namespaced to themselves', () => {
        const newConnector1 = new NewConnector1()
        const newConnector2 = new ConnectorWithMissingOverloads()

        analyticsManager.init(initOptions, newConnector1, newConnector2)
        analyticsManager.distribute('NewConnector1.type', 'payload')
        analyticsManager.distribute('NewConnector2.type2', 'payload2')

        expect(newConnector1.receive.mock.calls).toEqual([['type', 'payload', undefined]])
        expect(newConnector2.receive.mock.calls).toEqual([['type2', 'payload2', undefined]])
    })

    test('no analytics connector will receive analytics events that are malformed', () => {
        const newConnector1 = new NewConnector1()
        const newConnector2 = new ConnectorWithMissingOverloads()
        const newConnector3 = new ThrowingConnector()

        analyticsManager.init(initOptions, newConnector1, newConnector2)
        analyticsManager.distribute('.type', 'payload')

        expect(newConnector1.receive.mock.calls).toEqual([])
        expect(newConnector2.receive.mock.calls).toEqual([])

        analyticsManager.distribute('NewConnector1.', 'payload')

        expect(newConnector1.receive.mock.calls).toEqual([])
        expect(newConnector3.receive.mock.calls).toEqual([])
    })

    test("does not throw error when one of connector's receive throws an error", () => {
        const newConnector1 = new NewConnector1()
        const newConnector3 = new ThrowingConnector()

        analyticsManager.init(initOptions, newConnector1, newConnector3)
        analyticsManager.distribute('type', 'payload')

        expect(newConnector1.receive.mock.calls).toEqual([['type', 'payload', undefined]])
    })

    test('addConnector throws error when the addition of a new connector is not an instance of Connector', () => {
        const newConnector1 = new NewConnector1()
        const newConnector2 = {}

        analyticsManager.init(initOptions, newConnector1)

        expect(() => {
            analyticsManager.addConnector(newConnector2)
        }).toThrow()
    })

    test('addition of a new connector after analyticsManager.init is invoked also receives analytics events after it has been added', () => {
        const newConnector1 = new NewConnector1()
        const newConnector2 = new ConnectorWithMissingOverloads()

        analyticsManager.init(initOptions, newConnector1)
        analyticsManager.distribute('type1', 'payload1')

        expect(newConnector1.receive.mock.calls).toEqual([['type1', 'payload1', undefined]])
        expect(newConnector2.receive.mock.calls).toEqual([])

        analyticsManager.addConnector(newConnector2)
        analyticsManager.distribute('type2', 'payload2')

        expect(newConnector1.receive.mock.calls).toEqual([
            ['type1', 'payload1', undefined],
            ['type2', 'payload2', undefined]
        ])
        expect(newConnector2.receive.mock.calls).toEqual([['type2', 'payload2', undefined]])
    })

    test('captures element focus events', () => {
        const newConnector1 = new NewConnector1()

        analyticsManager.init(initOptions, newConnector1)

        simulateDomEvent('focus', 'test_input', 'input')
        simulateDomEvent('focus', 'test_radio', 'input', 'radio', 'test_value')
        simulateDomEvent('focus', 'test_checkbox', 'input', 'checkbox')
        simulateDomEvent('focus', 'test_select', 'select')
        simulateDomEvent('focus', 'test_element', 'div')
        simulateDomEvent('focus', 'test_textarea', 'textarea')

        expect(newConnector1.receive.mock.calls).toEqual([
            [
                'uiInteraction',
                {
                    subject: 'user',
                    action: 'Focus',
                    object: 'Input',
                    name: 'test_input'
                },
                undefined
            ],
            [
                'uiInteraction',
                {
                    subject: 'user',
                    action: 'Focus',
                    object: 'Input',
                    name: 'test_radio',
                    content: 'test_value'
                },
                undefined
            ],
            [
                'uiInteraction',
                {
                    subject: 'user',
                    action: 'Focus',
                    object: 'Input',
                    name: 'test_checkbox',
                    content: 'true'
                },
                undefined
            ],
            [
                'uiInteraction',
                {
                    subject: 'user',
                    action: 'Focus',
                    object: 'Input',
                    name: 'test_select',
                    content: ''
                },
                undefined
            ],
            [
                'uiInteraction',
                {
                    subject: 'user',
                    action: 'Click',
                    object: 'Element',
                    name: 'test_element'
                },
                undefined
            ],
            [
                'uiInteraction',
                {
                    subject: 'user',
                    action: 'Focus',
                    object: 'Input',
                    name: 'test_textarea'
                },
                undefined
            ]
        ])
    })

    test('console warns when data-analytics-name is not defined', () => {
        const newConnector1 = new NewConnector1()

        analyticsManager.init(
            {
                ...initOptions,
                debug: true
            },
            newConnector1
        )

        simulateDomEvent('focus', undefined, 'input')

        expect(window.console.error.mock.calls[1][0]).toBe(
            "Element must have 'data-analytics-name' attribute defined"
        )
    })

    test('same input focus does not double bind event listener', () => {
        const newConnector1 = new NewConnector1()

        analyticsManager.init(initOptions, newConnector1)

        const el = simulateDomEvent('focus', 'test_input', 'input', 'text', 'test', 'testing')
        dispatchEvent(el, 'focus')

        expect(newConnector1.receive.mock.calls).toEqual([
            [
                'uiInteraction',
                {
                    subject: 'user',
                    action: 'Focus',
                    object: 'Input',
                    name: 'test_input',
                    content: 'testing'
                },
                undefined
            ],
            [
                'uiInteraction',
                {
                    subject: 'user',
                    action: 'Focus',
                    object: 'Input',
                    name: 'test_input',
                    content: 'testing'
                },
                undefined
            ]
        ])
    })

    test('global instance is callable', () => {
        const newConnector1 = new NewConnector1()

        analyticsManager.init(initOptions, newConnector1)

        expect(window.Progressive.analytics.constants.UI_SUBJECT.app).toEqual('app')
        expect(window.Progressive.analytics.send).toBeDefined()

        window.Progressive.analytics.send({
            action: window.Progressive.analytics.constants.UI_ACTION.display,
            object: window.Progressive.analytics.constants.UI_OBJECT.button,
            name: window.Progressive.analytics.constants.UI_NAME.applePay
        })

        window.Progressive.analytics.send({
            subject: window.Progressive.analytics.constants.UI_SUBJECT.user,
            action: window.Progressive.analytics.constants.UI_ACTION.click,
            object: window.Progressive.analytics.constants.UI_OBJECT.button,
            name: window.Progressive.analytics.constants.UI_NAME.address,
            content: 'test'
        })

        expect(newConnector1.receive.mock.calls).toEqual([
            [
                'uiInteraction',
                {
                    subject: 'app',
                    action: 'Display',
                    object: 'Button',
                    name: 'apple_pay'
                },
                undefined
            ],
            [
                'uiInteraction',
                {
                    subject: 'user',
                    action: 'Click',
                    object: 'Button',
                    name: 'address',
                    content: 'test'
                },
                undefined
            ]
        ])
    })

    test('collects view performance metrics with development with no assets', () => {
        const newConnector1 = new NewConnector1()

        window.Progressive.PerformanceTiming = {
            timingStart: 0
        }

        analyticsManager.init(initOptions, newConnector1)

        // First load metrics
        analyticsManager.collectPerformance('templateWillMount')
        analyticsManager.collectPerformance('templateDidMount')
        analyticsManager.collectPerformance('templateAPIEnd')

        // View metrics
        analyticsManager.collectPerformance('templateWillMount')
        analyticsManager.collectPerformance('templateDidMount')
        analyticsManager.collectPerformance('templateAPIEnd')

        const mockedCall = newConnector1.receive.mock.calls[0]
        const checkCallDelay = (timingValue) => {
            expect(timingValue).toBeGreaterThanOrEqual(0)
            expect(timingValue).toBeLessThan(5)
        }

        expect(mockedCall[0]).toBe('performance')
        expect(mockedCall[1].bundle).toBe('development')
        checkCallDelay(mockedCall[1].templateWillMount)
        checkCallDelay(mockedCall[1].templateDidMount)
        checkCallDelay(mockedCall[1].templateAPIEnd)
        expect(mockedCall[1].timingStart).toBeDefined()
        // if no assets, use templateAPIEnd as fullPageLoad time
        expect(mockedCall[1].fullPageLoad).toBe(mockedCall[1].templateAPIEnd)
    })

    test('collects view performance metrics with development', () => {
        const newConnector1 = new NewConnector1()

        window.Progressive.PerformanceTiming = {
            timingStart: 0
        }

        analyticsManager.init(initOptions, newConnector1)

        // First load metrics
        analyticsManager.collectPerformance('templateWillMount')
        analyticsManager.countAsset()
        analyticsManager.collectPerformance('templateDidMount')
        analyticsManager.collectPerformance('templateAPIEnd')

        // View metrics
        analyticsManager.collectPerformance('templateWillMount')
        analyticsManager.collectPerformance('templateDidMount')
        analyticsManager.collectPerformance('templateAPIEnd')
        analyticsManager.collectPerformance('fullPageLoad')

        const mockedCall = newConnector1.receive.mock.calls[0]
        const checkCallDelay = (timingValue) => {
            expect(timingValue).toBeGreaterThanOrEqual(0)
            expect(timingValue).toBeLessThan(5)
        }

        expect(mockedCall[0]).toBe('performance')
        expect(mockedCall[1].bundle).toBe('development')
        checkCallDelay(mockedCall[1].templateWillMount)
        checkCallDelay(mockedCall[1].templateDidMount)
        checkCallDelay(mockedCall[1].templateAPIEnd)
        checkCallDelay(mockedCall[1].fullPageLoad)
        expect(mockedCall[1].timingStart).toBeDefined()
        expect(mockedCall[1].fullPageLoad).toBeDefined()
    })

    test('collects view performance metrics with production script', () => {
        const newConnector1 = new NewConnector1()

        window.Progressive.PerformanceTiming = {
            timingStart: 0
        }

        // Purposely injecting a script that has the word 'production' to
        // ensure the performance metrics will detect a production bundle
        const scriptel = document.createElement('script')
        scriptel.id = 'progressive-web-main'
        scriptel.src = '/production.js'
        document.body.insertBefore(scriptel, document.querySelectorAll('script')[0])

        analyticsManager.init(initOptions, newConnector1)

        // First load metrics
        analyticsManager.collectPerformance('templateWillMount')
        analyticsManager.countAsset()
        analyticsManager.collectPerformance('templateDidMount')
        analyticsManager.collectPerformance('templateAPIEnd')
        analyticsManager.collectPerformance('fullPageLoad')

        // View metrics
        analyticsManager.collectPerformance('templateWillMount')
        analyticsManager.countAsset()
        analyticsManager.collectPerformance('templateDidMount')
        analyticsManager.collectPerformance('templateAPIEnd')
        analyticsManager.collectPerformance('fullPageLoad')

        expect(newConnector1.receive.mock.calls[0][1].bundle).toBe('production')
    })

    test('collects view performance metrics with production script with more than one image assets', () => {
        const newConnector1 = new NewConnector1()

        window.Progressive.PerformanceTiming = {
            timingStart: 0
        }

        // Purposely injecting a script that has the word 'production' to
        // ensure the performance metrics will detect a production bundle
        const scriptel = document.createElement('script')
        scriptel.id = 'progressive-web-main'
        scriptel.src = '/production.js'
        document.body.insertBefore(scriptel, document.querySelectorAll('script')[0])

        analyticsManager.init(initOptions, newConnector1)

        // First load metrics
        analyticsManager.collectPerformance('templateWillMount')
        analyticsManager.countAsset()
        analyticsManager.countAsset()
        analyticsManager.collectPerformance('templateDidMount')
        analyticsManager.collectPerformance('templateAPIEnd')
        analyticsManager.collectPerformance('fullPageLoad')
        analyticsManager.collectPerformance('fullPageLoad')

        // View metrics
        analyticsManager.collectPerformance('templateWillMount', 1)
        analyticsManager.countAsset()
        analyticsManager.countAsset()
        analyticsManager.collectPerformance('templateDidMount', 2)
        analyticsManager.collectPerformance('templateAPIEnd', 3)
        analyticsManager.collectPerformance('fullPageLoad', 4)
        analyticsManager.collectPerformance('fullPageLoad', 5)

        expect(newConnector1.receive.mock.calls[1][1].fullPageLoad).toBe(4)
    })

    test("collects view performance metrics after one second when assets doesn't complete their load", () => {
        const newConnector1 = new NewConnector1()

        window.Progressive.PerformanceTiming = {
            timingStart: 0
        }

        // Purposely injecting a script that has the word 'production' to
        // ensure the performance metrics will detect a production bundle
        const scriptel = document.createElement('script')
        scriptel.id = 'progressive-web-main'
        scriptel.src = '/production.js'
        document.body.insertBefore(scriptel, document.querySelectorAll('script')[0])

        analyticsManager.init(initOptions, newConnector1)

        // First load metrics
        analyticsManager.collectPerformance('templateWillMount')
        analyticsManager.collectPerformance('templateDidMount')
        analyticsManager.collectPerformance('templateAPIEnd')

        // View metrics
        analyticsManager.collectPerformance('templateWillMount', 1)
        analyticsManager.countAsset()
        analyticsManager.countAsset()
        analyticsManager.collectPerformance('templateDidMount', 2)
        analyticsManager.collectPerformance('templateAPIEnd', 3)
        analyticsManager.collectPerformance('fullPageLoad', 4)

        jest.runAllTimers()

        expect(newConnector1.receive.mock.calls[1][1].fullPageLoad).toBe(3)
    })
})
