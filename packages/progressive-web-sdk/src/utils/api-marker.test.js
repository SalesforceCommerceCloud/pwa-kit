/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {deprecate, experimental} from './api-marker'
let log = require('loglevel')

describe('Api Marker', () => {
    test('deprecated', () => {
        log.warn = jest.fn()
        const testFunction1 = () => {
            deprecate('msg')
        }
        testFunction1()
        expect(log.warn.mock.calls[0][0]).toEqual(
            `%c [MOBIFY API WARNING]: You are currently using an deprecated function: [testFunction1]. msg`
        )

        testFunction1()
        expect(log.warn).toHaveBeenCalledTimes(1)

        const testFunction2 = () => {
            deprecate()
        }
        testFunction2()
        expect(log.warn.mock.calls[1][0]).toEqual(
            `%c [MOBIFY API WARNING]: You are currently using an deprecated function: [testFunction2]. `
        )
    })
    test('experimental', () => {
        log.warn = jest.fn()
        const testFunction3 = () => {
            experimental('msg')
        }
        testFunction3()
        expect(log.warn.mock.calls[0][0]).toEqual(
            `%c [MOBIFY API WARNING]: You are currently using an experimental function: [testFunction3] This function may change at any time. msg`
        )

        testFunction3()
        expect(log.warn).toHaveBeenCalledTimes(1)

        const testFunction4 = () => {
            experimental()
        }
        testFunction4()
        expect(log.warn.mock.calls[1][0]).toEqual(
            `%c [MOBIFY API WARNING]: You are currently using an experimental function: [testFunction4] This function may change at any time. `
        )
    })
})
