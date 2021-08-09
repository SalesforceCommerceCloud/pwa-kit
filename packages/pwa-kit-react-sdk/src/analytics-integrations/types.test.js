/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import * as types from './types'

describe('analytics event types', () => {
    test('types are all strings', () => {
        expect(types).toMatchObject({
            PAGEVIEW: expect.any(String),
            OFFLINE: expect.any(String),
            PERFORMANCE: expect.any(String),
            UIINTERACTION: expect.any(String),
            ADDTOCART: expect.any(String),
            REMOVEFROMCART: expect.any(String),
            ADDTOWISHLIST: expect.any(String),
            REMOVEFROMWISHLIST: expect.any(String),
            PURCHASE: expect.any(String),
            PRODUCTIMPRESSION: expect.any(String),
            ERROR: expect.any(String),
            LOCALE: expect.any(String)
        })
    })
})

describe('The validate function', () => {
    const spec = {
        id: {required: true},
        name: {required: false, sanitizer: (x) => x.toUpperCase()},
        price: {required: true, sanitizer: (x) => x}
    }

    const validSpec = {id: 1, name: 'NAME', price: 123}

    test('should validate analytics data objects', () => {
        expect(() => types.validate(spec, {})).toThrowError(
            'Please provide Analytics data to track.'
        )
        expect(() => types.validate(spec)).toThrowError('Please provide Analytics data to track.')
        expect(() => types.validate(spec, {id: 1})).toThrow()
        expect(() => types.validate(spec, {id: 1, name: 'name'})).toThrow()
        expect(
            types.validate(spec, {
                id: 1,
                name: 'name',
                price: 123
            })
        ).toEqual({id: 1, name: 'NAME', price: 123})
        const valid = {id: 1, name: 'NAME', price: 123}
        expect(types.validate(spec, valid)).toEqual(valid)
        expect(types.validate(spec, valid)).not.toBe(valid) // Should return a copy
    })

    test('should validate spec with nested spec', () => {
        const nestedSpecReq = {
            ...spec,
            someKey: {required: true, instanceOf: spec}
        }

        const nestedSpecOpt = {
            ...spec,
            someKey: {required: false, instanceOf: spec}
        }

        const valid = {...validSpec, someKey: validSpec}

        expect(() =>
            types.validate(nestedSpecReq, {...validSpec, someKey: {name: 'NAME', price: 123}})
        ).toThrow()
        expect(() => types.validate(nestedSpecReq, validSpec)).toThrow()
        expect(types.validate(nestedSpecReq, valid)).toEqual(valid)
        expect(types.validate(nestedSpecReq, valid)).not.toBe(valid) // Should return a copy

        expect(() =>
            types.validate(nestedSpecOpt, {...validSpec, someKey: {name: 'NAME', price: 123}})
        ).toThrow()
        expect(types.validate(nestedSpecOpt, validSpec)).toEqual(validSpec)
        expect(types.validate(nestedSpecOpt, valid)).toEqual(valid)
        expect(types.validate(nestedSpecOpt, valid)).not.toBe(valid) // Should return a copy
    })

    test('should validate spec with array spec', () => {
        const nestedSpecReq = {
            ...spec,
            array: {required: true, arrayOf: spec}
        }
        const nestedSpecOpt = {
            ...spec,
            array: {required: false, arrayOf: spec}
        }
        const valid = {...validSpec, array: [validSpec, validSpec, validSpec]}
        expect(() =>
            types.validate(nestedSpecReq, {
                ...validSpec,
                array: [validSpec, {name: 'NAME', price: 123}]
            })
        ).toThrow()
        expect(types.validate(nestedSpecReq, valid)).toEqual(valid)
        expect(types.validate(nestedSpecReq, valid)).not.toBe(valid) // Should return a copy

        expect(
            types.validate(nestedSpecOpt, {
                ...validSpec,
                array: []
            })
        ).toEqual({
            ...validSpec,
            array: []
        })
        expect(types.validate(nestedSpecOpt, validSpec)).toEqual(validSpec)
        expect(types.validate(nestedSpecOpt, valid)).toEqual(valid)
        expect(types.validate(nestedSpecOpt, valid)).not.toBe(valid) // Should return a copy
    })
})

describe('the renameKey function', () => {
    test('should rename an object key', () => {
        const object = {
            a: 1,
            b: 2,
            c: 3
        }

        expect(types.renameKey(object, 'b', 'd')).toEqual({
            a: 1,
            d: 2,
            c: 3
        })
    })

    test('should throw an error if key does not exist', () => {
        const object = {
            a: 1,
            b: 2,
            c: 3
        }

        expect(() => types.renameKey(object, 'd', 'e')).toThrowError(`key d does not exist`)
    })
})

describe('the sanitizeMoney function', () => {
    test('', () => {
        expect(types.sanitizeMoney('USD $1.23')).toBe('1.23')
        expect(types.sanitizeMoney('$3,000')).toBe('3000')
        expect(types.sanitizeMoney('$ 123,400.33')).toBe('123400.33')
        expect(types.sanitizeMoney('$109.')).toBe('109')
        expect(types.sanitizeMoney('109. $')).toBe('109')
        expect(types.sanitizeMoney('1,344.20$')).toBe('1344.20')
        expect(types.sanitizeMoney('1.234.567,10')).toBe('1234567.10')
        expect(types.sanitizeMoney('60.2')).toBe('60.2')
        expect(types.sanitizeMoney('$15..13')).toBe('15.13')
        expect(types.sanitizeMoney("1'234'567'890,12")).toBe('1234567890.12')
        expect(types.sanitizeMoney('0.99')).toBe('0.99')
        expect(types.sanitizeMoney(0.99)).toBe('0.99')
        expect(types.sanitizeMoney('.99')).toBe('')
        expect(types.sanitizeMoney('1')).toBe('1')
        expect(types.sanitizeMoney('')).toBe('')
        expect(types.sanitizeMoney('foobar')).toBe('')
        expect(types.sanitizeMoney('☃')).toBe('')
        expect(types.sanitizeMoney('..')).toBe('')
        expect(types.sanitizeMoney('Rp1.235')).toBe('1235')
        expect(types.sanitizeMoney('1 234,56 р.')).toBe('1234.56')
        expect(types.sanitizeMoney('1 234,56 лв.')).toBe('1234.56')
        expect(types.sanitizeMoney('ر.س.‏ 1,234.56')).toBe('1234.56')
        expect(types.sanitizeMoney('ريال 1,234/56')).toBe('1234.56')
        expect(types.sanitizeMoney('€ 27,95')).toBe('27.95')
    })
})
