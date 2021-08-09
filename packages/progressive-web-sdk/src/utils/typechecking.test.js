/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {typecheck} from './typechecking'

describe('typecheck', () => {
    let realConsoleError
    beforeEach(() => {
        realConsoleError = console.error
        console.error = jest.fn()
    })

    afterEach(() => {
        console.error = realConsoleError
    })

    test('runs the check method on the type with the value', () => {
        const type = {check: jest.fn()}

        const value = {test: 'true!'}

        typecheck(type, value)

        expect(type.check).toHaveBeenCalledTimes(1)
        expect(type.check).toHaveBeenCalledWith(value)
    })

    test('returns the value on success', () => {
        const type = {check: () => {}}

        const value = {value: 5}

        expect(typecheck(type, value)).toBe(value)
    })

    test('prints an error if the check method throws', () => {
        const type = {
            check: () => {
                throw new Error('error')
            }
        }

        const value = 'test'

        typecheck(type, value)

        expect(console.error).toHaveBeenCalledTimes(1)
    })

    test('returns the value on failure', () => {
        const type = {
            check: () => {
                throw new Error()
            }
        }
        const value = {value: 0}

        expect(typecheck(type, value)).toBe(value)
    })
})
