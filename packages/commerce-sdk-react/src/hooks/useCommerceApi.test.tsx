/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import 'react'
import useCommerceApi from './useCommerceApi'
import {API_CLIENTS_KEYS, renderHookWithProviders} from '../test-utils'

jest.mock('../auth/index.ts')

describe('useCommerceApi', () => {
    test('returns a set of api clients', () => {
        const {result} = renderHookWithProviders(() => useCommerceApi())
        const apiClients = result.current

        API_CLIENTS_KEYS.forEach((key) => {
            expect(apiClients[key]).toBeDefined()
        })
    })
})
