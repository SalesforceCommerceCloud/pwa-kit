/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import DataObject from './data-object'

// We are mocking the console outputs because we are testing debug information is outputting
// but this makes the terminal screen really noisy. Below is a toggle to see console output
const showOutput = false

const consoleErr = window.console.error
const consoleWarn = window.console.warn

// Mocking the console object
const wrapOutputWithJest = (originalFn) => {
    return jest.fn((...args) => {
        if (showOutput) {
            originalFn.apply(this, args)
        }
    })
}

// Make sure we have a clean call queue every test
const mockConsoleOutput = () => {
    window.console.error = wrapOutputWithJest(consoleErr)
    window.console.warn = wrapOutputWithJest(consoleWarn)
}

class MyDataObject extends DataObject {
    static get REQUIREKEY1() {
        return 'requireKey1'
    }
    static get REQUIREKEY2() {
        return 'requireKey2'
    }
    static get ADDITIONALKEY1() {
        return 'additionalKey1'
    }
    static get ADDITIONALKEY2() {
        return 'additionalKey2'
    }
    static get ADDITIONALKEY3() {
        return 'additionalKey3'
    }

    constructor(fields, additionalRequiredFields, keyMap, keepExtraFields = false) {
        super(
            [MyDataObject.REQUIREKEY1, MyDataObject.REQUIREKEY2],
            [MyDataObject.ADDITIONALKEY1, MyDataObject.ADDITIONALKEY2, MyDataObject.ADDITIONALKEY3],
            fields,
            keepExtraFields
        )

        this.isValid(additionalRequiredFields, keyMap)

        this.sanitizeMoney(MyDataObject.ADDITIONALKEY3)

        return this.build(keyMap)
    }
}

const buildMoneyDataObject = (value) => {
    const dataObject = new MyDataObject({
        requireKey1: 'test',
        requireKey2: 'test',
        additionalKey3: value
    })
    return dataObject.additionalKey3
}

describe('DataObject', () => {
    beforeEach(() => {
        mockConsoleOutput()
    })

    test('initializes', () => {
        const dataObject = new DataObject()

        expect(dataObject.build()).toEqual({})
    })

    test('initializes extended object', () => {
        const dataObject = new MyDataObject({
            requireKey1: 'test',
            requireKey2: 'test'
        })

        expect(dataObject).toEqual({
            requireKey1: 'test',
            requireKey2: 'test'
        })
    })

    test('initializes extended object with integer', () => {
        const dataObject = new MyDataObject({
            requireKey1: 0,
            requireKey2: 1
        })

        expect(dataObject).toEqual({
            requireKey1: '0',
            requireKey2: '1'
        })
    })

    test('builds a correct object when key mapping object is provided', () => {
        const dataObject = new MyDataObject(
            {
                requireKey1: 'test',
                requireKey2: 'test'
            },
            [],
            {
                requireKey1: {
                    name: 'newKeyName'
                }
            }
        )

        expect(dataObject).toEqual({
            newKeyName: 'test',
            requireKey2: 'test'
        })
    })

    test('builds a correct object when default value for a key is provided', () => {
        const dataObject = new MyDataObject(
            {
                requireKey2: 'test'
            },
            [],
            {
                requireKey1: {
                    defaultValue: 'default value'
                }
            }
        )

        expect(dataObject).toEqual({
            requireKey1: 'default value',
            requireKey2: 'test'
        })
    })

    test('discards unaccepted keys', () => {
        const dataObject = new MyDataObject({
            requireKey1: 'test',
            requireKey2: 'test',
            otherKey: 'otherKey'
        })

        expect(dataObject).toEqual({
            requireKey1: 'test',
            requireKey2: 'test'
        })
    })

    test('errors when a required key is not supplied', () => {
        let dataObject
        expect(() => {
            dataObject = new MyDataObject({
                requireKey1: 'test'
            })
        }).toThrow()
        expect(dataObject).toBeUndefined()
    })

    test('validates the additional required keys', () => {
        const dataObject = new MyDataObject(
            {
                requireKey1: 'test',
                requireKey2: 'test',
                additionalKey1: 'test'
            },
            [MyDataObject.ADDITIONALKEY1]
        )

        expect(dataObject).toEqual({
            requireKey1: 'test',
            requireKey2: 'test',
            additionalKey1: 'test'
        })
    })

    test('normalize valid undefined keys', () => {
        const dataObject = new MyDataObject({
            requireKey1: 'test',
            requireKey2: 'test',
            additionalKey1: undefined
        })

        expect(dataObject).toEqual({
            requireKey1: 'test',
            requireKey2: 'test',
            additionalKey1: ''
        })
    })

    test('normalize valid null keys', () => {
        const dataObject = new MyDataObject({
            requireKey1: 'test',
            requireKey2: 'test',
            additionalKey1: null
        })

        expect(dataObject).toEqual({
            requireKey1: 'test',
            requireKey2: 'test',
            additionalKey1: ''
        })
    })

    test('keeps extra keys when specified', () => {
        const dataObject = new MyDataObject(
            {
                requireKey1: 'test',
                requireKey2: 'test',
                notInListKey: 'test'
            },
            [],
            {},
            true
        )

        expect(dataObject).toEqual({
            requireKey1: 'test',
            requireKey2: 'test',
            notInListKey: 'test'
        })
    })

    test('errors when a required key from the additional requirement is not supplied', () => {
        let dataObject
        expect(() => {
            dataObject = new MyDataObject(
                {
                    requireKey1: 'test',
                    requireKey2: 'test'
                },
                [MyDataObject.ADDITIONALKEY1]
            )
        }).toThrow()
        expect(dataObject).toBeUndefined()
    })

    test('sanitizes money value', () => {
        expect(buildMoneyDataObject('USD $1.23')).toBe('1.23')
        expect(buildMoneyDataObject('$3,000')).toBe('3000')
        expect(buildMoneyDataObject('$ 123,400.33')).toBe('123400.33')
        expect(buildMoneyDataObject('$109.')).toBe('109')
        expect(buildMoneyDataObject('109. $')).toBe('109')
        expect(buildMoneyDataObject('1,344.20$')).toBe('1344.20')
        expect(buildMoneyDataObject('1.234.567,10')).toBe('1234567.10')
        expect(buildMoneyDataObject('60.2')).toBe('60.2')
        expect(buildMoneyDataObject('$15..13')).toBe('15.13')
        expect(buildMoneyDataObject("1'234'567'890,12")).toBe('1234567890.12')
        expect(buildMoneyDataObject('0.99')).toBe('0.99')
        expect(buildMoneyDataObject(0.99)).toBe('0.99')
        expect(buildMoneyDataObject('.99')).toBe('')
        expect(buildMoneyDataObject('1')).toBe('1')
        expect(buildMoneyDataObject('')).toBe('')
        expect(buildMoneyDataObject('foobar')).toBe('')
        expect(buildMoneyDataObject('☃')).toBe('')
        expect(buildMoneyDataObject('..')).toBe('')
        expect(buildMoneyDataObject('Rp1.235')).toBe('1235')
        expect(buildMoneyDataObject('1 234,56 р.')).toBe('1234.56')
        expect(buildMoneyDataObject('1 234,56 лв.')).toBe('1234.56')
        expect(buildMoneyDataObject('ر.س.‏ 1,234.56')).toBe('1234.56')
        expect(buildMoneyDataObject('ريال 1,234/56')).toBe('1234.56')
        expect(buildMoneyDataObject('€ 27,95')).toBe('27.95')
    })
})
