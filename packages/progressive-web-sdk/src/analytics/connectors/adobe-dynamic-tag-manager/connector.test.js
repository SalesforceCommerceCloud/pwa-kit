/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import AdobeDynamicTagManager from './connector'

// We are mocking the console outputs because we are testing debug information is outputting
// but this makes the terminal screen really noisy. Below is a toggle to see console output
const showOutput = false

const consoleErr = window.console.error
const consoleWarn = window.console.warn
const consoleInfo = window.console.info
const consoleLog = window.console.log

const SATELLITE_URL = '//assets.adobedtm.com/123/satelliteLib-123.js'
const SUITE_ID = 'testReportSuiteId'

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

const mockSatellite = () => {
    window._satellite = {
        getToolsByType: () => [
            {
                onSCodeLoaded: jest.fn()
            }
        ],
        pageBottom: jest.fn()
    }

    window.s_gi = jest.fn()
}

const initializeConnector = () => {
    const dtm = new AdobeDynamicTagManager('Test', SATELLITE_URL, SUITE_ID, {debug: true})

    // Because we require extenal scripts to load s_code, we'll mock it up.
    const t = jest.fn()
    const clearVars = () => {
        // Reset the s object.
        dtm.s = {clearVars, t}
    }

    dtm.s = {clearVars, t}
    dtm.isReady = true

    return dtm
}

describe('Adobe Dynamic Tag Manager', () => {
    beforeEach(() => {
        // Clean all scripts
        ;[...document.getElementsByTagName('script')].forEach((script) => {
            document.body.removeChild(script)
        })

        mockConsoleOutput()
        mockSatellite()

        // Ensure we have a script on the page. Otherwise the `loadScript` function
        // doesn't work.
        // TODO: Fix the base connector to not need this requirement
        const el = document.createElement('script')
        el.src = `/scripts/first.js`
        document.body.appendChild(el)
    })

    test('initializes', () => {
        const myDTM = new AdobeDynamicTagManager('Test', SATELLITE_URL, SUITE_ID)

        expect(myDTM).toBeDefined()

        const scripts = document.getElementsByTagName('script')
        expect(scripts.length).toBe(2)
    })

    test('throws error if satellite library url is not provided', () => {
        let myDTM
        expect(() => {
            myDTM = new AdobeDynamicTagManager()
        }).toThrow()

        expect(myDTM).toBeUndefined()
    })

    test('throws error if suite id is not provided', () => {
        let myDTM
        expect(() => {
            myDTM = new AdobeDynamicTagManager('test', 'test')
        }).toThrow()

        expect(myDTM).toBeUndefined()
    })

    test('ready does not error when all requirements are met', () => {
        const myDTM = new AdobeDynamicTagManager('Test', SATELLITE_URL, SUITE_ID)

        expect(() => {
            myDTM.ready()
        }).not.toThrow()
    })

    test('recieving an unknown ui interaction event doesn`t clear the alanytics variable', () => {
        const myDTM = initializeConnector()
        const oldS = {
            ...myDTM.s
        }

        myDTM.s.events = 'test_event'

        myDTM.receive('uiInteraction', {
            name: 'test_event',
            object: 'element'
        })

        expect(myDTM.s).not.toEqual(oldS)
    })

    test('purchase event with invalid payload throws an error', () => {
        const myDTM = initializeConnector()

        expect(() => {
            myDTM.purchaseEvent({})
        }).toThrow()
    })

    test('purchase event sets the correct page variables', () => {
        const myDTM = initializeConnector()

        myDTM.purchaseEvent({
            transaction: {
                id: '0000001'
            },
            products: [
                {
                    category: '',
                    name: 'shirt',
                    quantity: 1,
                    price: 99.99
                }
            ]
        })

        expect(myDTM.s.events).toEqual('purchase')
        expect(myDTM.s.products).toEqual(';shirt;1;99.99')
        expect(myDTM.s.purchaseID).toEqual('0000001')
    })

    test('purchase event sets the correct page variables with no product name', () => {
        const myDTM = initializeConnector()

        myDTM.purchaseEvent({
            transaction: {
                id: '0000001'
            },
            products: [
                {
                    category: '',
                    quantity: 1,
                    price: 99.99
                }
            ]
        })

        expect(myDTM.s.events).toEqual('purchase')
        expect(myDTM.s.products).toEqual(';;1;99.99')
        expect(myDTM.s.purchaseID).toEqual('0000001')
    })

    test('add to cart event with invalid payload throws error', () => {
        const myDTM = initializeConnector()

        expect(() => {
            myDTM.addToCartEvent({})
        }).toThrow()
    })

    test('add to cart event sets page variables with partial payload', () => {
        const myDTM = initializeConnector()

        myDTM.addToCartEvent({
            product: {
                id: 1,
                title: 'shirt',
                quantity: 1,
                price: 99.99
            }
        })

        expect(myDTM.s.events).toEqual('scAdd')
        expect(myDTM.s.products).toEqual(';shirt(1);1;99.99')
    })

    test('add to cart event sets page variables with partial payload with empty title', () => {
        const myDTM = initializeConnector()

        myDTM.addToCartEvent({
            product: {
                quantity: 1,
                price: 99.99
            }
        })

        expect(myDTM.s.events).toEqual('scAdd')
        expect(myDTM.s.products).toEqual(';;1;99.99')
    })

    test('add to cart event sets page variables with partial payload without id', () => {
        const myDTM = initializeConnector()

        myDTM.addToCartEvent({
            product: {
                title: 'shirt',
                quantity: 1,
                price: 99.99
            }
        })

        expect(myDTM.s.events).toEqual('scAdd')
        expect(myDTM.s.products).toEqual(';shirt;1;99.99')
    })

    test('add to cart event sets page variables with full payload', () => {
        const myDTM = initializeConnector()

        myDTM.addToCartEvent({
            product: {
                category: 'tops',
                title: 'shirt',
                quantity: 1,
                price: 99.99
            }
        })

        expect(myDTM.s.events).toEqual('scAdd')
        expect(myDTM.s.products).toEqual('tops;shirt;1;99.99')
    })

    test('remove from cart event with invalid payload throws error', () => {
        const myDTM = initializeConnector()

        expect(() => {
            myDTM.removeFromCartEvent({})
        }).toThrow()
    })

    test('remove from cart event sets page variables using minimal payload', () => {
        const myDTM = initializeConnector()

        myDTM.removeFromCartEvent({
            product: {
                id: 1,
                title: 'shirt',
                quantity: 1,
                price: 99.99
            }
        })

        expect(myDTM.s.events).toEqual('scRemove')
        expect(myDTM.s.products).toEqual(';shirt(1);1;99.99')
    })

    test('remove from cart event sets page variables without id', () => {
        const myDTM = initializeConnector()

        myDTM.removeFromCartEvent({
            product: {
                title: 'shirt',
                quantity: 1,
                price: 99.99
            }
        })

        expect(myDTM.s.events).toEqual('scRemove')
        expect(myDTM.s.products).toEqual(';shirt;1;99.99')
    })

    test('remove from cart event sets page variables without title', () => {
        const myDTM = initializeConnector()

        myDTM.removeFromCartEvent({
            product: {
                quantity: 1,
                price: 99.99
            }
        })

        expect(myDTM.s.events).toEqual('scRemove')
        expect(myDTM.s.products).toEqual(';;1;99.99')
    })

    test('remove from cart event sets page variables using full payload', () => {
        const myDTM = initializeConnector()

        myDTM.removeFromCartEvent({
            product: {
                category: 'tops',
                title: 'shirt',
                quantity: 1,
                price: 99.99
            }
        })

        expect(myDTM.s.events).toEqual('scRemove')
        expect(myDTM.s.products).toEqual('tops;shirt;1;99.99')
    })

    test('page view event with invalid payload throws error', () => {
        const myDTM = initializeConnector()

        expect(() => {
            myDTM.pageviewEvent({})
        }).toThrow()
    })

    test('page view event sets page variable', () => {
        const myDTM = initializeConnector()

        myDTM.pageviewEvent({
            templateName: 'testPage'
        })

        expect(myDTM.s.pageName).toEqual('testPage')
    })

    test('patching scode overrides sc onloaded callback', () => {
        const myDTM = initializeConnector()

        const mockSC = {
            onSCodeLoaded: () => 'test'
        }

        myDTM.patchSCode(mockSC)

        expect(mockSC).not.toBeUndefined()
        expect(mockSC.onSCodeLoaded()).toEqual('test')
        expect(myDTM.isReady).toEqual(true)
    })

    test('patching scode without sc throws error', () => {
        const myDTM = initializeConnector()

        expect(() => {
            myDTM.patchSCode()
        }).toThrow()
    })

    test('clear empties page variables', () => {
        const myDTM = initializeConnector()

        myDTM.s.pageName = 'testpage'

        myDTM.clear()

        expect(myDTM.s.pageName).toBeUndefined()
    })

    test('ready returns undefined if satellite variable isn`t defined', () => {
        const myDTM = initializeConnector()

        window._satellite = undefined

        expect(myDTM.ready()).toBeUndefined()
    })

    test('send throws error when s variable isn`t defined', () => {
        const myDTM = new AdobeDynamicTagManager('Test', SATELLITE_URL, SUITE_ID, {debug: true})

        expect(() => {
            myDTM.send()
        }).toThrow()
    })
})
