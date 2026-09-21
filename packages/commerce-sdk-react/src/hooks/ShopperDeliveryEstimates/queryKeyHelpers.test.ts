/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {getDeliveryEstimates} from './queryKeyHelpers'

describe('Shopper Delivery Estimates query keys', () => {
    test('include each delivery destination and product parameter', () => {
        const base = {
            organizationId: 'f_ecom_zzrmy_orgf_001',
            siteId: 'RefArchGlobal',
            productIds: ['sku-a'],
            postalCode: '94105',
            countryCode: 'US'
        }

        expect(getDeliveryEstimates.queryKey(base)).not.toEqual(
            getDeliveryEstimates.queryKey({...base, productIds: ['sku-b']})
        )
        expect(getDeliveryEstimates.queryKey(base)).not.toEqual(
            getDeliveryEstimates.queryKey({...base, postalCode: '10001'})
        )
        expect(getDeliveryEstimates.queryKey(base)).not.toEqual(
            getDeliveryEstimates.queryKey({...base, countryCode: 'CA'})
        )
        expect(getDeliveryEstimates.queryKey(base)).not.toEqual(
            getDeliveryEstimates.queryKey({...base, siteId: 'SiteGenesis'})
        )
        expect(getDeliveryEstimates.queryKey(base)).not.toEqual(
            getDeliveryEstimates.queryKey({...base, personalized: 'none'})
        )
    })
})
