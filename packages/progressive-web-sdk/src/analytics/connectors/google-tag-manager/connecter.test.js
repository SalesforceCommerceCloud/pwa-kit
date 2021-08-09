/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import GoogleTagManager from './connector'

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

const GTM_CONTAINER_NAME = 'GTM-5MTKVRQ'

const purchaseInfo = {
    transaction: {
        id: 't-124',
        revenue: '160'
    },
    products: [
        {
            id: 'p-123',
            name: 'Red Potion',
            price: '90',
            quantity: 1
        },
        {
            id: 'p-456',
            name: 'Blue Potion',
            price: '45',
            quantity: 1
        }
    ]
}

describe('Google Tag Manager', () => {
    beforeEach(() => {
        // Clean all scripts
        ;[...document.getElementsByTagName('script')].forEach((script) => {
            document.body.removeChild(script)
        })

        window.dataLayer = null

        mockConsoleOutput()

        // Append first script tag
        const el = document.createElement('script')
        el.src = `/scripts/first.js`
        document.body.appendChild(el)
    })

    test('initializes', () => {
        const myGTM = new GoogleTagManager('Test', GTM_CONTAINER_NAME)

        expect(myGTM).toBeDefined()
        expect(window.dataLayer.length).toBe(1)
        expect(window.dataLayer[0]['gtm.start']).toBeDefined()
        expect(window.dataLayer[0].event).toBe('gtm.js')

        const scripts = document.getElementsByTagName('script')
        expect(scripts.length).toBe(2)
    })

    test('throws error if container id is not provided', () => {
        let myGTM
        expect(() => {
            myGTM = new GoogleTagManager()
        }).toThrow()

        expect(myGTM).toBeUndefined()
    })

    test('ready does not error when all requirements are met', () => {
        const myGTM = new GoogleTagManager('Test', GTM_CONTAINER_NAME)

        expect(() => {
            myGTM.ready()
        }).not.toThrow()
    })

    test('sends a pageview event', () => {
        const myGTM = new GoogleTagManager('Test', GTM_CONTAINER_NAME, {debug: true})

        myGTM.ready()
        myGTM.receive('pageview', {templateName: 'test'})

        expect(window.dataLayer[1]).toEqual({
            event: 'Pageview',
            templateName: 'test'
        })
        expect(console.log.mock.calls.length).toBe(1)
    })

    test('sends a purchase event', () => {
        const myGTM = new GoogleTagManager('Test', GTM_CONTAINER_NAME)

        myGTM.ready()
        myGTM.receive('purchase', purchaseInfo)

        expect(window.dataLayer[1]).toEqual({
            event: 'Ecommerce',
            ec: {
                purchase: {
                    actionField: {
                        id: 't-124',
                        revenue: '160'
                    },
                    products: [
                        {
                            id: 'p-123',
                            name: 'Red Potion',
                            price: '90',
                            quantity: 1
                        },
                        {
                            id: 'p-456',
                            name: 'Blue Potion',
                            price: '45',
                            quantity: 1
                        }
                    ]
                }
            }
        })
    })
})
