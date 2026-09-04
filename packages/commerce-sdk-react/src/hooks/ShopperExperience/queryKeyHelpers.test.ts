/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as helpers from './queryKeyHelpers'

describe('ShopperExperience queryKeyHelpers.getComponent', () => {
    const params = {organizationId: 'org1', componentId: 'comp1', siteId: 'site1'}

    test('path is the components path', () => {
        expect(helpers.getComponent.path(params)).toEqual([
            '/commerce-sdk-react',
            '/organizations/',
            'org1',
            '/components/',
            'comp1'
        ])
    })

    test('queryKey appends valid params', () => {
        const key = helpers.getComponent.queryKey(params)
        expect(key.slice(0, 5)).toEqual([
            '/commerce-sdk-react',
            '/organizations/',
            'org1',
            '/components/',
            'comp1'
        ])
        expect(key[5]).toMatchObject({
            organizationId: 'org1',
            componentId: 'comp1',
            siteId: 'site1'
        })
    })
})
