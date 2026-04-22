/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import alertTheme from '@salesforce/retail-react-app/app/theme/components/base/alert'

describe('Alert theme overrides', () => {
    describe('baseStyle', () => {
        test('description color is black regardless of status', () => {
            const statuses = ['error', 'success', 'warning', 'info']
            statuses.forEach((status) => {
                const result = alertTheme.baseStyle({status})
                expect(result.description.color).toBe('black')
            })
        })

        test('description does not include ml (no left margin for default alerts)', () => {
            const result = alertTheme.baseStyle({status: 'error'})
            expect(result.description.ml).toBeUndefined()
        })

        test('description has fontSize sm', () => {
            const result = alertTheme.baseStyle({status: 'error'})
            expect(result.description.fontSize).toBe('sm')
        })

        test('container has borderRadius base', () => {
            const result = alertTheme.baseStyle({status: 'error'})
            expect(result.container).toEqual({borderRadius: 'base'})
        })

        test('icon color maps to correct colorScheme per status', () => {
            expect(alertTheme.baseStyle({status: 'error'}).icon.color).toBe('red.500')
            expect(alertTheme.baseStyle({status: 'success'}).icon.color).toBe('green.500')
            expect(alertTheme.baseStyle({status: 'warning'}).icon.color).toBe('orange.500')
            expect(alertTheme.baseStyle({status: 'info'}).icon.color).toBe('blue.500')
        })

        test('defaults to green colorScheme when status is unknown', () => {
            const result = alertTheme.baseStyle({status: 'unknown'})
            expect(result.icon.color).toBe('green.500')
        })

        test('colorScheme prop takes precedence over status', () => {
            const result = alertTheme.baseStyle({colorScheme: 'purple', status: 'error'})
            expect(result.icon.color).toBe('purple.500')
        })
    })

    describe('variants.subtle', () => {
        test('returns container with border styles based on status', () => {
            const result = alertTheme.variants.subtle({status: 'error'})
            expect(result.container).toEqual({
                borderColor: 'red.600',
                borderWidth: 1,
                borderStyle: 'solid'
            })
        })

        test('does not override description styles', () => {
            const result = alertTheme.variants.subtle({status: 'error'})
            expect(result.description).toBeUndefined()
        })
    })

    describe('variants.outlined', () => {
        test('returns container with bg and border based on status', () => {
            const result = alertTheme.variants.outlined({status: 'error'})
            expect(result.container).toEqual({
                bg: 'red.50',
                borderColor: 'red.600',
                borderWidth: 1,
                borderStyle: 'solid'
            })
        })

        test('description has ml and colorScheme-specific color', () => {
            const result = alertTheme.variants.outlined({status: 'success'})
            expect(result.description).toEqual({
                ml: 3,
                color: 'green.700'
            })
        })

        test('uses correct colors for all statuses', () => {
            const statusColorMap = {error: 'red', success: 'green', warning: 'orange', info: 'blue'}
            for (const [status, color] of Object.entries(statusColorMap)) {
                const result = alertTheme.variants.outlined({status})
                expect(result.description.color).toBe(`${color}.700`)
                expect(result.container.bg).toBe(`${color}.50`)
                expect(result.container.borderColor).toBe(`${color}.600`)
            }
        })

        test('colorScheme prop takes precedence over status', () => {
            const result = alertTheme.variants.outlined({colorScheme: 'purple', status: 'error'})
            expect(result.description.color).toBe('purple.700')
            expect(result.container.bg).toBe('purple.50')
        })
    })
})
