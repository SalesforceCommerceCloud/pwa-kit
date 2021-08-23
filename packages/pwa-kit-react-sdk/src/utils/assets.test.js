/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-env jest */

import {loadScript} from './assets'

import sinon from 'sinon'

const sandbox = sinon.sandbox.create()

// Silence the error messages, they're on purpose here
let consoleError
beforeEach(() => {
    consoleError = console.error
    console.error = jest.fn()
})

afterEach(() => {
    console.error = consoleError
    sandbox.restore()
})

describe('loadScript', () => {
    let fakeScriptElement
    const headElement = document.getElementsByTagName('head')[0]
    const originalReadyState = document.readyState

    beforeEach(() => {
        fakeScriptElement = {
            id: null,
            src: null,
            async: null,
            charset: null,
            onload: null,
            onerror: null,
            dataset: {}
        }

        // Mock out createElement and body.appendChild so that we don't have
        // to fetch an actual script
        sandbox.stub(document, 'createElement').returns(fakeScriptElement)
        sandbox.stub(headElement, 'appendChild')
        sandbox.stub(document, 'write')

        Object.defineProperty(document, 'readyState', {
            value: 'loading',
            writable: true
        })

        // If you need to actually see the logging from these modules,
        // change these `.stub()` calls to `.spy()`. Tests won't be affected.
        sandbox.stub(console, 'log')
        sandbox.stub(console, 'warn')
    })

    afterAll(() => {
        sandbox.restore()
        document.readyState = originalReadyState
    })

    test('loadScript defaults to using the DOM to load the script', () => {
        loadScript({
            id: 'loadScriptTest1',
            src: 'loadScriptTest1src'
        })
        expect(document.createElement.called).toBe(true)
        expect(headElement.appendChild.called).toBe(true)
        const element = headElement.appendChild.getCall(0).args[0]
        expect(element.id).toEqual('loadScriptTest1')
        expect(element.src).toEqual('loadScriptTest1src')
    })

    test('loadScript uses document.write when the flag is enabled', () => {
        loadScript({
            id: 'loadScriptTest1',
            src: 'loadScriptTest1src',
            docwrite: true
        })

        expect(document.write.called).toBe(true)
    })

    test('loadScript aborts if it finds the requested script has already been attempted', () => {
        sandbox.stub(document, 'querySelectorAll').returns([1])

        loadScript({
            id: 'loadScriptTest1',
            src: 'loadScriptTest1src'
        })

        // Shouldn't have tried either method of inserting the script
        expect(document.createElement.called).toBe(false)
        expect(headElement.appendChild.called).toBe(false)
        expect(document.write.called).toBe(false)
    })

    test('loadScript throws if `onload` is provided but is not a function', () => {
        expect(() => {
            loadScript({
                src: 'loadScriptTest2src',
                onload: 'onload expects this to be a function'
            })
        }).toThrow()
    })

    test('loadScript throws if `onerror` is provided but is not a function', () => {
        expect(() => {
            loadScript({
                src: 'loadScriptTest2src',
                onerror: 'onerror expects this to be a function'
            })
        }).toThrow()
    })
})
