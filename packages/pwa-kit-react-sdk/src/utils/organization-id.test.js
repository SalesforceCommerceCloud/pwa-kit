/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {parseOrganizationId} from './organization-id'

describe('parseOrganizationId', () => {
    test('parses realm and instance type from a production org id', () => {
        expect(parseOrganizationId('f_ecom_bjnl_prd')).toEqual({
            realm: 'bjnl',
            instanceType: 'prd'
        })
    })

    test('parses a numeric instance type', () => {
        expect(parseOrganizationId('f_ecom_zzrf_001')).toEqual({
            realm: 'zzrf',
            instanceType: '001'
        })
    })

    test('ignores trailing segments beyond realm and instance type', () => {
        expect(parseOrganizationId('f_ecom_bjnl_prd_extra')).toEqual({
            realm: 'bjnl',
            instanceType: 'prd'
        })
    })

    test('returns only realm when instance type segment is absent', () => {
        expect(parseOrganizationId('f_ecom_bjnl')).toEqual({realm: 'bjnl'})
    })

    test('returns empty object for undefined input', () => {
        expect(parseOrganizationId(undefined)).toEqual({})
    })

    test('returns empty object for empty string', () => {
        expect(parseOrganizationId('')).toEqual({})
    })

    test('returns empty object for non-string input', () => {
        expect(parseOrganizationId(12345)).toEqual({})
    })

    test('handles an id without the f_ecom_ prefix', () => {
        expect(parseOrganizationId('bjnl_prd')).toEqual({
            realm: 'bjnl',
            instanceType: 'prd'
        })
    })
})
