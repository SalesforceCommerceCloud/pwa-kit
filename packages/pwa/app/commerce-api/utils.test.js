/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import jwt from 'njwt'
import {
    camelCaseKeysToUnderscore,
    isTokenValid,
    keysToCamel,
    convertSnakeCaseToSentenceCase,
    handleAsyncError
} from './utils'

const createJwt = (secondsToExp) => {
    const token = jwt.create({}, 'test')
    token.setExpiration(new Date().getTime() + secondsToExp * 1000)
    return token.compact()
}

describe('isTokenValid', () => {
    test('returns false when no token given', () => {
        expect(isTokenValid()).toBe(false)
    })

    test('returns true for valid token', () => {
        const token = createJwt(600)
        const bearerToken = `Bearer ${token}`
        expect(isTokenValid(token)).toBe(true)
        expect(isTokenValid(bearerToken)).toBe(true)
    })

    test('returns false if token expires within 60 econds', () => {
        expect(isTokenValid(createJwt(59))).toBe(false)
    })
})

describe('keysToCamel', () => {
    test('converts object keys to camelcase', () => {
        const input = {
            numba_one: true,
            'numba-two': false,
            number3: 'un-changed',
            c_Custom: 'un_changed',
            _custom: 'unchanged'
        }

        const result = keysToCamel(input)

        expect(result).toEqual({
            numbaOne: true,
            numbaTwo: false,
            number3: 'un-changed',
            c_Custom: 'un_changed',
            _custom: 'unchanged'
        })
    })

    test('converts arrays of objects to camelcase', () => {
        const input = [
            {
                numba_one: true,
                number3: 'un-changed',
                c_Custom: 'un_changed',
                _custom: 'unchanged'
            },
            {
                'numba-two': false
            }
        ]

        const result = keysToCamel(input)

        expect(result).toEqual([
            {
                numbaOne: true,
                number3: 'un-changed',
                c_Custom: 'un_changed',
                _custom: 'unchanged'
            },
            {
                numbaTwo: false
            }
        ])
    })

    test('converts nested keys to camelcase', () => {
        const input = {
            numba_one: {
                sub1: 'unchanged',
                sub2: {sub_sub_2: 'changed'},
                sub3: [{sub_sub_3: 'changed', sub3Sub4: 'unchanged'}]
            }
        }

        const result = keysToCamel(input)

        expect(result).toEqual({
            numbaOne: {
                sub1: 'unchanged',
                sub2: {subSub_2: 'changed'},
                sub3: [{subSub_3: 'changed', sub3Sub4: 'unchanged'}]
            }
        })
    })
})

describe('camelCaseKeysToUnderscore', () => {
    test('camelCaseToUnderScore returns a copy of the object with renamed keys (deep/recursvive)', () => {
        const camelCaseObject = {
            testKey: {
                nestedTestKey: {
                    deepDownKey: 'value'
                }
            }
        }
        const underScoreKeys = camelCaseKeysToUnderscore(camelCaseObject)

        expect(camelCaseObject).toStrictEqual({
            testKey: {
                nestedTestKey: {
                    deepDownKey: 'value'
                }
            }
        })
        expect(underScoreKeys.test_key).toBeDefined()
        expect(underScoreKeys.test_key.nested_test_key).toBeDefined()
        expect(underScoreKeys.test_key.nested_test_key.deep_down_key).toBeDefined()
    })

    test('doesnt mutate input object', () => {
        const input = {
            testKey: {
                nestedTestKey: {
                    deepDownKey: 'value'
                }
            }
        }

        camelCaseKeysToUnderscore(input)

        expect(input).toStrictEqual({
            testKey: {
                nestedTestKey: {
                    deepDownKey: 'value'
                }
            }
        })
    })

    test('converts camel case keys to snake case', () => {
        const input = {
            testKey: {
                nestedTestKey: {
                    deepDownKey: 'value'
                },
                nestedArr: [{myKey: 'changed', my_key2: 'unchanged'}]
            }
        }

        const result = camelCaseKeysToUnderscore(input)

        expect(result).toEqual({
            test_key: {
                nested_arr: [{my_key: 'changed', my_key2: 'unchanged'}],
                nested_test_key: {
                    deep_down_key: 'value'
                }
            }
        })
    })

    test('converts keys in array of objects', () => {
        const input = [
            {
                testKey: 'changed'
            },
            {
                test_key: 'unchanged'
            }
        ]

        const result = camelCaseKeysToUnderscore(input)

        expect(result).toEqual([
            {
                test_key: 'changed'
            },
            {
                test_key: 'unchanged'
            }
        ])
    })

    test('avoids collision with existing key name', () => {
        const input = {
            test_key: 'unchanged',
            testKey: 'unchanged'
        }

        const result = camelCaseKeysToUnderscore(input)

        expect(result).toEqual({
            test_key: 'unchanged'
        })
    })
})

describe('convertSnakeCaseToSentenceCase', () => {
    test('convertSnakeCaseToSentenceCase returns correct formatted string', () => {
        const snakeCaseString = 'test_snake_case_string'
        const expectedSentenceCaseString = 'test snake case string'

        expect(convertSnakeCaseToSentenceCase(snakeCaseString) === expectedSentenceCaseString).toBe(
            true
        )
    })
})

describe('handleAsyncError', () => {
    test('returns result when no error is thrown', async () => {
        const func = jest.fn().mockResolvedValue(1)
        expect(await handleAsyncError(func)()).toBe(1)
    })
    test('throws error correctly', async () => {
        const errorResponse = {
            detail: 'detail',
            title: 'title',
            type: 'type'
        }
        const func = jest.fn().mockResolvedValue(errorResponse)
        await expect(handleAsyncError(func)()).rejects.toThrow(new Error(errorResponse.detail))
    })
    test('works even if func is not async', async () => {
        const func = jest.fn().mockReturnValue(1)
        expect(await handleAsyncError(func)()).toBe(1)
    })
})
