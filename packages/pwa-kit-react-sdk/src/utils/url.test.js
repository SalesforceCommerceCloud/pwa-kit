/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {getAppOrigin} from './url'

describe('getAppOrigin', () => {
    const OLD_ENV = process.env
    const OLD_WINDOW = global.window
    const TEST_ORIGIN = 'https://www.example.com'

    beforeEach(() => {
        jest.resetModules()
        process.env = {...OLD_ENV}
    })

    afterEach(() => {
        process.env = OLD_ENV
        global.window = OLD_WINDOW
    })

    test('returns `process.env.APP_ORIGIN` when on server', () => {
        // Simulate being on the server by deleting the window.
        delete global.window

        // Simulate starting the app server by simply setting the `APP_ORIGIN`
        process.env.APP_ORIGIN = TEST_ORIGIN

        expect(getAppOrigin()).toBe(TEST_ORIGIN)
    })

    test('returns `window.location.origin` when on client', () => {
        expect(getAppOrigin()).toBe('http://localhost')
    })

    test('throws error when APP_ORIGIN is not defined on server.', () => {
        // Simulate being on the server by deleting the window.
        delete global.window

        // Simulate app server not being initialized.
        process.env.APP_ORIGIN = undefined

        expect(() => {
            getAppOrigin()
        }).toThrow()
    })
})
