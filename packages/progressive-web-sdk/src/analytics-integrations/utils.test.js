/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {loadScript} from './utils'

describe('utils', () => {
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

        const scriptel = document.createElement('script')
        scriptel.id = 'progressive-web-main'
        document.body.appendChild(scriptel)
    })

    test('in loadScript(), same script should not load more than once', () => {
        const src = 'https://www.google-analytics.com/analytics.js'

        console.log = jest.fn()
        expect.assertions(2)
        return Promise.all([loadScript(src), loadScript(src)]).then(() => {
            expect(console.log).toHaveBeenCalledTimes(1)
            expect(console.log).toHaveBeenCalledWith(`Analytics: Success loading script ${src}`)
        })
    })

    test('in loadScript(), same script should not load more than once', () => {
        const src = 'https://www.google-analytics.com/analytics.js'
        const script = document.createElement('script')
        script.src = src
        script.loaded = true
        const firstScript = document.getElementsByTagName('script')[0]
        firstScript.parentNode.insertBefore(script, firstScript)

        console.log = jest.fn()
        expect.assertions(1)

        return loadScript(src).then(() => {
            expect(console.log).not.toHaveBeenCalled()
        })
    })

    test('console.error if this.src is bad', () => {
        const src = '//test'
        console.error = jest.fn()
        expect.assertions(1)

        return loadScript(src).catch(() => {
            // also expect JSDOM to emit error that resource cannot load.
            expect(console.error).toHaveBeenCalledWith(`Analytics: Error loading script ${src}`)
        })
    })

    test('in loadScript(), same script should not load more than once', () => {
        const src = '//test'
        const script = document.createElement('script')
        script.src = src
        const firstScript = document.getElementsByTagName('script')[0]
        firstScript.parentNode.insertBefore(script, firstScript)

        console.error = jest.fn()
        console.log = jest.fn()
        expect.assertions(2)

        return loadScript(src).catch(() => {
            // also expect JSDOM to emit error that resource cannot load.
            expect(console.error).not.toHaveBeenCalledWith(`Analytics: Error loading script ${src}`)
            expect(console.log).not.toHaveBeenCalled()
        })
    })
})
