/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import Monetate from './connector'

// We are mocking the console outputs because we are testing debug information is outputting
// but this makes the terminal screen really noisy. Below is a toggle to see console output
const showOutput = true

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

const MONETATE_TAG = '.test.mobify.com/custom.js'

describe('Monetate', () => {
    beforeEach(() => {
        // Clean all scripts
        ;[...document.getElementsByTagName('script')].forEach((script) => {
            document.body.removeChild(script)
        })

        window.monetateQ = null

        mockConsoleOutput()

        // Append first script tag
        const el = document.createElement('script')
        el.src = `/scripts/first.js`
        document.body.appendChild(el)
    })

    test('initializes', () => {
        const myMonetate = new Monetate('Test', MONETATE_TAG)

        expect(myMonetate).toBeDefined()
        expect(window.monetateQ).toBeDefined()

        const scripts = document.getElementsByTagName('script')
        expect(scripts.length).toBe(2)
    })

    test('throws error if container id is not provided', () => {
        let myMonetate
        expect(() => {
            myMonetate = new Monetate()
        }).toThrow()

        expect(myMonetate).toBeUndefined()
    })

    test('ready does not error when all requirements are met', () => {
        const myMonetate = new Monetate('Test', MONETATE_TAG)

        expect(() => {
            myMonetate.ready()
        }).not.toThrow()
    })

    test('sends a pageview event', () => {
        const myMonetate = new Monetate('Test', MONETATE_TAG)

        myMonetate.ready()
        myMonetate.receive('pageview', {templateName: 'test'})

        expect(window.monetateQ.length).toBe(1)
    })

    test('clean out monetate elements on pageview event', () => {
        const myMonetate = new Monetate('Test', MONETATE_TAG)

        myMonetate.ready()

        const monetateElement = document.createElement('div')
        monetateElement.id = 'monetate_selector-1'
        document.body.appendChild(monetateElement)

        expect(document.getElementById('monetate_selector-1')).toBeDefined()

        myMonetate.receive('pageview', {templateName: 'test'})

        expect(window.monetateQ.length).toBe(1)
        expect(document.getElementById('monetate_selector-1')).toBe(null)
    })
})
