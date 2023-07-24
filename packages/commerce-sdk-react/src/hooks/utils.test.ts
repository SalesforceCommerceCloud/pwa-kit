/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {ShopperBaskets} from 'commerce-sdk-isomorphic'
import {mergeOptions} from './utils'

describe('Hook utils', () => {
    test('mergeOptions merges body, header, and options', () => {
        // Required to match the interface, not important for the test
        const config = {
            shortCode: 'shortCode',
            clientId: 'clientId',
            organizationId: 'organizationId',
            siteId: 'siteId'
        }
        const client = new ShopperBaskets({
            parameters: {
                ...config,
                clientParameter: 'clientParameter'
            },
            headers: {
                clientHeader: 'clientHeader'
            }
        })
        const options = {
            body: {body: 'body'},
            parameters: {optionsParameter: 'optionsParameter'},
            headers: {optionsHeader: 'optionsHeader'}
        }
        const merged = mergeOptions(client, options)
        expect(merged).toEqual({
            body: {body: 'body'},
            parameters: {
                ...config,
                clientParameter: 'clientParameter',
                optionsParameter: 'optionsParameter'
            },
            headers: {
                clientHeader: 'clientHeader',
                optionsHeader: 'optionsHeader'
            }
        })
    })
})
