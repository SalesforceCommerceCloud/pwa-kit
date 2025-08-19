/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import countryList from '@salesforce/retail-react-app/app/api/adyen/utils/countryList'

describe('Country List', () => {
    it('should export an array of countries', () => {
        expect(Array.isArray(countryList)).toBe(true)
    })

    it('should contain a specific number of countries', () => {
        expect(countryList).toHaveLength(244)
    })
})
