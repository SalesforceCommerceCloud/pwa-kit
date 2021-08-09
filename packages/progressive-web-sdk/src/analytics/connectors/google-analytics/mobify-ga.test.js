/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import MobifyGa from './mobify-ga'

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

const TRACKER_NAME = 'mobifyTracker'
const initOption = {
    ecommerceLibrary: 'ec',
    mobifyGAID: 'testGAID'
}

const checkMockedCalls = (mockedQueue, values) => {
    const filteredQueue = mockedQueue.filter((queuedCall) => {
        return typeof queuedCall[0] !== 'function'
    })
    expect(filteredQueue).toEqual(values)
}

describe('Mobify Google Analyics Connector', () => {
    beforeEach(() => {
        // Clean all scripts
        ;[...document.getElementsByTagName('script')].forEach((script) => {
            document.body.removeChild(script)
        })

        mockConsoleOutput()

        window.ga = jest.fn((arg) => {
            // Mock Ga ready callback
            if (typeof arg === 'function') {
                arg()
            }
        })
        window.ga.getByName = (trackerName) => {
            if (trackerName === TRACKER_NAME) {
                return {
                    get: jest.fn()
                }
            }
            return undefined
        }

        // Append first script tag
        const el = document.createElement('script')
        el.src = `/scripts/first.js`
        document.body.appendChild(el)
    })

    test('initializes', () => {
        const myGA = new MobifyGa(initOption)

        expect(myGA).toBeDefined()
        expect(myGA.name).toBe('MobifyGoogleAnalytics')
        expect(myGA.trackerName).toBe(TRACKER_NAME)
        expect(myGA.options.ecommerceLibrary).toBe('ec')

        const scripts = document.getElementsByTagName('script')
        expect(scripts.length).toBe(2)
    })

    test('init throws error when required options are not present', () => {
        let myGA

        expect(() => {
            myGA = new MobifyGa({})
        }).toThrow()

        expect(myGA).toBeUndefined()
    })

    test('init throws error when Mobify specific required options are not present', () => {
        let myGA

        expect(() => {
            myGA = new MobifyGa({
                ecommerceLibrary: 'ec'
            })
        }).toThrow()

        expect(myGA).toBeUndefined()
    })

    test('ready does not error when all requirements are met', () => {
        const myGA = new MobifyGa(initOption)

        expect(() => {
            myGA.ready()
        }).not.toThrow()

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID', 'auto', {name: TRACKER_NAME}],
            [`${TRACKER_NAME}.set`, 'dimension1', '1']
        ])
    })

    test('sends a pageview event', () => {
        const myGA = new MobifyGa({
            ...initOption,
            debug: true
        })

        myGA.ready()
        myGA.receive('pageview', {templateName: 'test', someOtherKey: 'other'})

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID', 'auto', {name: TRACKER_NAME}],
            [`${TRACKER_NAME}.set`, 'dimension1', '1'],
            [`${TRACKER_NAME}.set`, 'dimension2', 'test'],
            [`${TRACKER_NAME}.set`, 'page', '/'],
            [`${TRACKER_NAME}.send`, 'pageview']
        ])
    })

    test('on add to cart event without a product, sent interaction event if on basic ecommerce', () => {
        const myGA = new MobifyGa({
            ...initOption,
            ecommerceLibrary: 'ecommerce',
            debug: true
        })

        myGA.ready()

        // Mock GA created tracker
        window.ga.getAll = jest.fn(() => {
            return [myGA.tracker]
        })

        myGA.receive('addToCart', {
            cart: {
                count: '42',
                someOtherKey: 'other'
            }
        })

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID', 'auto', {name: TRACKER_NAME}],
            [`${TRACKER_NAME}.set`, 'dimension1', '1'],
            [`${TRACKER_NAME}.send`, 'event', 'UX', 'click', 'add to cart']
        ])
    })

    test('on add to cart event without a product, sends relevant calls', () => {
        const myGA = new MobifyGa({
            ...initOption,
            debug: true
        })

        myGA.ready()

        // Mock GA created tracker
        window.ga.getAll = jest.fn(() => {
            return [myGA.tracker]
        })

        myGA.receive('addToCart', {
            cart: {
                count: '42',
                someOtherKey: 'other'
            }
        })

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID', 'auto', {name: TRACKER_NAME}],
            [`${TRACKER_NAME}.set`, 'dimension1', '1'],
            [`${TRACKER_NAME}.require`, 'ec'],
            [`${TRACKER_NAME}.ec:setAction`, 'add'],
            [`${TRACKER_NAME}.send`, 'event', 'UX', 'click', 'add to cart']
        ])
    })

    test('on add to cart event, sends relevant calls', () => {
        const myGA = new MobifyGa({
            ...initOption,
            debug: true
        })

        myGA.ready()

        // Mock GA created tracker
        window.ga.getAll = jest.fn(() => {
            return [myGA.tracker]
        })

        myGA.receive('addToCart', {
            cart: {
                count: '42',
                subTotal: '10'
            },
            product: {
                id: 'p-123',
                name: 'Red Potion',
                someOtherKey: 'other'
            }
        })

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID', 'auto', {name: TRACKER_NAME}],
            [`${TRACKER_NAME}.set`, 'dimension1', '1'],
            [`${TRACKER_NAME}.require`, 'ec'],
            [
                `${TRACKER_NAME}.ec:addProduct`,
                {
                    id: 'p-123',
                    name: 'Red Potion'
                }
            ],
            [`${TRACKER_NAME}.ec:setAction`, 'add'],
            [`${TRACKER_NAME}.send`, 'event', 'UX', 'click', 'add to cart']
        ])
    })

    test('on remove from cart event without a product, sent interaction event if on basic ecommerce', () => {
        const myGA = new MobifyGa({
            ...initOption,
            ecommerceLibrary: 'ecommerce',
            debug: true
        })

        myGA.ready()

        // Mock GA created tracker
        window.ga.getAll = jest.fn(() => {
            return [myGA.tracker]
        })

        myGA.receive('removeFromCart', {
            cart: {
                count: '42',
                someOtherKey: 'other'
            }
        })

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID', 'auto', {name: TRACKER_NAME}],
            [`${TRACKER_NAME}.set`, 'dimension1', '1'],
            [`${TRACKER_NAME}.send`, 'event', 'UX', 'click', 'remove from cart']
        ])
    })

    test('on remove from cart event without a product, sends relevant calls', () => {
        const myGA = new MobifyGa({
            ...initOption,
            debug: true
        })

        myGA.ready()

        // Mock GA created tracker
        window.ga.getAll = jest.fn(() => {
            return [myGA.tracker]
        })

        myGA.receive('removeFromCart', {
            cart: {
                count: '42'
            }
        })

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID', 'auto', {name: TRACKER_NAME}],
            [`${TRACKER_NAME}.set`, 'dimension1', '1'],
            [`${TRACKER_NAME}.require`, 'ec'],
            [`${TRACKER_NAME}.ec:setAction`, 'remove'],
            [`${TRACKER_NAME}.send`, 'event', 'UX', 'click', 'remove from cart']
        ])
    })

    test('on remove from cart event, sends relevant calls', () => {
        const myGA = new MobifyGa({
            ...initOption,
            debug: true
        })

        myGA.ready()

        // Mock GA created tracker
        window.ga.getAll = jest.fn(() => {
            return [myGA.tracker]
        })

        myGA.receive('removeFromCart', {
            cart: {
                count: '42',
                subTotal: '10',
                someOtherKey: 'other'
            },
            product: {
                id: 'p-123',
                name: 'Red Potion',
                someOtherKey: 'other'
            }
        })

        checkMockedCalls(window.ga.mock.calls, [
            ['create', 'testGAID', 'auto', {name: TRACKER_NAME}],
            [`${TRACKER_NAME}.set`, 'dimension1', '1'],
            [`${TRACKER_NAME}.require`, 'ec'],
            [
                `${TRACKER_NAME}.ec:addProduct`,
                {
                    id: 'p-123',
                    name: 'Red Potion'
                }
            ],
            [`${TRACKER_NAME}.ec:setAction`, 'remove'],
            [`${TRACKER_NAME}.send`, 'event', 'UX', 'click', 'remove from cart']
        ])
    })
})
