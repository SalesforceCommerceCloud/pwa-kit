/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const {validateOtpTokenLength, DEFAULT_OTP_TOKEN_LENGTH} = require('./utils.js')

describe('validateOtpTokenLength', () => {
    describe('valid values', () => {
        test.each([
            [6, 6],
            [8, 8],
            ['6', 6],
            ['8', 8]
        ])('returns %s when tokenLength is %s', (tokenLength, expected) => {
            expect(validateOtpTokenLength(tokenLength)).toBe(expected)
        })

        test('returns default when tokenLength is undefined', () => {
            expect(validateOtpTokenLength(undefined)).toBe(DEFAULT_OTP_TOKEN_LENGTH)
        })
    })

    describe('invalid values', () => {
        test.each([7, '7', 'abc', null, 0, '', true, false])(
            'throws error when tokenLength is "%s"',
            (tokenLength) => {
                expect(() => validateOtpTokenLength(tokenLength)).toThrow(
                    new RegExp(`Invalid OTP token length: ${tokenLength}. Valid values are 6 or 8`)
                )
            }
        )
    })
})
