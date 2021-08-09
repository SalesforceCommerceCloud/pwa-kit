/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {normalizePhone} from './normalize-utils'

const areaCodeNumber = '604'
const exchangeNumber = '431'
const lineNumber = '5987'

test("Return value if it's empty", () => {
    expect(normalizePhone(false)).toBe(false)
})

describe('Checks if no previous value', () => {
    test('Checks if only areacode', () => {
        expect(normalizePhone(areaCodeNumber)).toBe(`(${areaCodeNumber}) `)
    })

    test('Checks for areacode and exchange number', () => {
        expect(normalizePhone(`${areaCodeNumber}${exchangeNumber}`)).toBe(
            `(${areaCodeNumber}) ${exchangeNumber}-`
        )
    })
})

test('Checks for area code format', () => {
    const shortAreaCode = areaCodeNumber.substring(0, areaCodeNumber.length - 1)
    expect(normalizePhone(areaCodeNumber, `${areaCodeNumber}5`)).toBe(`(${areaCodeNumber}`)
    expect(
        normalizePhone(shortAreaCode, shortAreaCode.substring(0, shortAreaCode.length - 1))
    ).toBe(`(${shortAreaCode}`)
})

test('Checks for area code and exchange number', () => {
    const number = `${areaCodeNumber}${exchangeNumber}`
    const extraDigitNumber = `${areaCodeNumber}${exchangeNumber}5`
    expect(normalizePhone(number, extraDigitNumber)).toBe(`(${areaCodeNumber}) ${exchangeNumber}`)
})

test('Checks for the full number', () => {
    const number = `${areaCodeNumber}${exchangeNumber}${lineNumber}`
    const extraDigitNumber = `${areaCodeNumber}${exchangeNumber}${lineNumber}5`
    expect(normalizePhone(number, extraDigitNumber)).toBe(
        `(${areaCodeNumber}) ${exchangeNumber}-${lineNumber}`
    )
})
