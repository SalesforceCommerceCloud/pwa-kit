/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import 'react'
import useCommerceApi from './useCommerceApi'
import {renderHookWithProviders} from '../test-utils'
import {ApiClients} from './types'

jest.mock('../auth/index.ts')

describe('useCommerceApi', () => {
    test('returns a set of api clients', () => {
        const clients: (keyof ApiClients)[] = [
            'shopperBaskets',
            'shopperContexts',
            'shopperCustomers',
            'shopperGiftCertificates',
            'shopperLogin',
            'shopperOrders',
            'shopperProducts',
            'shopperPromotions',
            'shopperSearch'
        ]
        const {result} = renderHookWithProviders(() => useCommerceApi())
        clients.forEach((name) => {
            expect(result.current[name]).toBeDefined()
        })
    })
})
