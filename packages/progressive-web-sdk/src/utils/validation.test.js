/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {
    validateFullName,
    validateCCExpiry,
    validateCCNumber,
    validatePostalCode
} from './validation'

test('Validates that the given full name has at least two', () => {
    ;['John Smith', 'Rebecca Pearson Bertha Campbell', "Mike O'Leary"].forEach((name) => {
        expect(validateFullName(name)).toBe(true)
    })
})

describe('Checks to see if a credit card has expired given the expiry date', () => {
    const today = new Date()
    const thisMonth = `0${today.getMonth() + 1}`.slice(-2)
    const thisYear = today.getFullYear() % 100

    const currentDate = `${thisMonth}${thisYear}`
    const futureDate = `${thisMonth}${thisYear + 1}`
    const pastDate = `${thisMonth}${thisYear - 1}`

    test('Works on the current date', () => {
        expect(validateCCExpiry(currentDate)).toBe(true)
    })

    test('Works on any future date', () => {
        expect(validateCCExpiry(futureDate)).toBe(true)
    })

    test('Output error if format is incorrect', () => {
        const incorrectDate = currentDate.slice(1)
        expect(validateCCExpiry(incorrectDate)).toBe(false)
    })

    test('If same year and currently month is higher than expired month', () => {
        const month = `0${thisMonth - 1}`.slice(-2)
        expect(validateCCExpiry(`${month}${thisYear}`)).toBe(false)
    })

    test('Output error if date is past', () => {
        expect(validateCCExpiry(pastDate)).toBe(false)
    })
})

test('Validates the given credit card number', () => {
    // Using the credit card numbers list from https://github.com/chriso/validator.js/blob/master/test/validators.js#L2698
    // so you will get the expecting data from validate library.
    const testCardNumbers = [
        '375556917985515',
        '36050234196908',
        '4716461583322103',
        '4716-2210-5188-5662',
        '4929 7226 5379 7141',
        '5398228707871527',
        '6283875070985593',
        '6263892624162870',
        '6234917882863855',
        '6234698580215388',
        '6226050967750613',
        '6246281879460688',
        '2222155765072228',
        '2225855203075256',
        '2720428011723762',
        '2718760626256570',
        '6765780016990268'
    ]

    testCardNumbers.forEach((card) => {
        expect(validateCCNumber(card)).toBe(true)
    })
})

describe('Validates the given postal code according to the rules for the given country', () => {
    test('Checks for postal code from the common patterns', () => {
        // common patterns
        const threeDigit = '123'
        const fourDigit = '1234'
        const fiveDigit = '12345'
        const sixDigit = '123456'

        const testPostalCodes = {
            AT: fourDigit,
            AU: fourDigit,
            BE: fourDigit,
            BG: fourDigit,
            CA: 'A1A 1A1',
            CH: fourDigit,
            CZ: fiveDigit,
            DE: fiveDigit,
            DK: fourDigit,
            DZ: fiveDigit,
            ES: fiveDigit,
            FI: fiveDigit,
            FR: fiveDigit,
            GB: 'A99 9AA',
            GR: fiveDigit,
            IL: fiveDigit,
            IM: 'IM2 1AA',
            IN: sixDigit,
            IS: threeDigit,
            IT: fiveDigit,
            JP: '105-0001',
            KE: fiveDigit,
            LI: '9490',
            MX: fiveDigit,
            NL: '2500 DL',
            NO: fourDigit,
            PL: '44-100',
            PT: '6270-321',
            RO: sixDigit,
            RU: sixDigit,
            SA: fiveDigit,
            SE: fiveDigit,
            SK: fiveDigit,
            TW: threeDigit,
            US: fiveDigit,
            ZA: fourDigit,
            ZM: fiveDigit
        }

        for (const [id, code] of Object.entries(testPostalCodes)) {
            expect(validatePostalCode(code, id)).toBe(true)
        }
    })

    test('Throw error if no countryId is given', () => {
        expect(() => {
            validatePostalCode('1234')
        }).toThrow()
    })

    test('Throw error if country id is not recognized', () => {
        console.error = jest.fn()
        validatePostalCode('1234', '##')
        expect(console.error).toHaveBeenCalledTimes(1)
    })
})
