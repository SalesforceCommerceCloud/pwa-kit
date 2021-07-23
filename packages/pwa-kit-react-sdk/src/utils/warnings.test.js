/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {deprecated, experimental} from './warnings'

describe('warnings', () => {
    let original
    beforeEach(() => {
        original = console.warn
        console.warn = jest.fn()
    })
    afterEach(() => {
        console.warn = original
    })

    test('deprecated', () => {
        const testFunction1 = () => {
            deprecated('msg')
        }
        testFunction1()
        expect(console.warn.mock.calls[0][0]).toEqual(
            `[MOBIFY API WARNING]: You are currently using an deprecated function: [testFunction1]. msg`
        )

        testFunction1()
        expect(console.warn).toHaveBeenCalledTimes(1)

        const testFunction2 = () => {
            deprecated()
        }
        testFunction2()
        expect(console.warn.mock.calls[1][0]).toEqual(
            `[MOBIFY API WARNING]: You are currently using an deprecated function: [testFunction2]. `
        )
    })

    test('experimental', () => {
        const testFunction3 = () => {
            experimental('msg')
        }
        testFunction3()
        expect(console.warn.mock.calls[0][0]).toEqual(
            `[MOBIFY API WARNING]: You are currently using an experimental function: [testFunction3] This function may change at any time. msg`
        )

        testFunction3()
        expect(console.warn).toHaveBeenCalledTimes(1)

        const testFunction4 = () => {
            experimental()
        }
        testFunction4()
        expect(console.warn.mock.calls[1][0]).toEqual(
            `[MOBIFY API WARNING]: You are currently using an experimental function: [testFunction4] This function may change at any time. `
        )
    })
})
