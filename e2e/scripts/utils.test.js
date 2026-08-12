/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

jest.mock('@axe-core/playwright', () => jest.fn())
jest.mock('@playwright/test', () => ({expect: jest.fn()}))

const {sanitizeFailureSummary} = require('./utils')

describe('sanitizeFailureSummary', () => {
    test('normalizes computed color contrast values without removing stable context', () => {
        const expected =
            'Fix any of the following:\n  Element has insufficient color contrast (font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1'

        expect(
            sanitizeFailureSummary(
                'color-contrast',
                'Fix any of the following:\n  Element has insufficient color contrast of 4.17 (foreground color: #0176d3, background color: #f3f3f3, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1'
            )
        ).toBe(expected)
        expect(
            sanitizeFailureSummary(
                'color-contrast',
                'Fix any of the following:\n  Element has insufficient color contrast of 4.21 (foreground color: #0176d3, background color: #f4f4f4, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1'
            )
        ).toBe(expected)
    })

    test('preserves non-color-contrast failure summaries', () => {
        const failureSummary =
            'Fix all of the following:\n  ARIA attribute is not allowed: aria-expanded="false"'

        expect(sanitizeFailureSummary('aria-allowed-attr', failureSummary)).toBe(failureSummary)
    })
})
