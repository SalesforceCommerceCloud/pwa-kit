/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {positiveValue, positiveNumber, percentage, childIndexProp} from './prop-type-utils'

test('positiveValue returns an Error if the value is a negative number/string', () => {
    ;[-1, -2, '-1', '-2'].forEach((value) => {
        const result = positiveValue({value}, 'value', 'Test')

        expect(result.toString().startsWith('Error:')).toBe(true)
    })
})

test('positiveValue returns an Error if the value is zero or a string with zero', () => {
    ;[0, '0', '00'].forEach((value) => {
        const result = positiveValue({value}, 'value', 'Test')

        expect(result.toString().startsWith('Error:')).toBe(true)
    })
})

test('positiveValue returns null if the value is a positive number/string', () => {
    ;[1, 2, '1', '2'].forEach((value) => {
        const result = positiveValue({value}, 'value', 'Test')

        expect(result).toBeNull()
    })
})

test('positiveNumber returns an Error if the value is a negative number', () => {
    const result = positiveNumber({test: -1}, 'test', 'Test')

    expect(result.toString().startsWith('Error:')).toBe(true)
})

test('positiveNumber returns an Error if the value is not a number', () => {
    const result = positiveNumber({test: 'test'}, 'test', 'Test')

    expect(result.toString().startsWith('Error:')).toBe(true)
})

test('positiveNumber returns null if the value is a positive number', () => {
    expect(positiveNumber({test: 5}, 'test', 'Test')).toBe(null)
})

test('percentage should return null for a valid nonzero percentage', () => {
    ;[1, 5, 10, 50, 75, 100].forEach((value) => {
        expect(percentage({value}, 'value', 'Test')).toBe(null)
    })
})

test('percentage should return an error for values outside the range', () => {
    ;[0, 250, -5].forEach((value) => {
        const result = percentage({value}, 'value', 'Test')

        expect(result.toString().startsWith('Error:')).toBe(true)
    })
})

test('childIndexProp returns null if the value is a valid index', () => {
    expect(childIndexProp({test: 1, children: [0, 1]}, 'test', 'Test')).toBe(null)
})

test('childIndexProp returns an error if the value is an invalid index', () => {
    const result = childIndexProp({test: 2, children: [0]}, 'test', 'Test')

    expect(result.toString().startsWith('Error:')).toBe(true)
})
