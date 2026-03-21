/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {act} from '@testing-library/react'
import nock from 'nock'

import {ApiClients, Argument} from '../types'
import {ShopperAgentsMutation, useShopperAgentsMutation} from './mutation'
import {
    mockMutationEndpoints,
    renderHookWithProviders,
    waitAndExpectSuccess
} from '../../test-utils'
import {CLIENT_KEYS} from '../../constant'

jest.mock('../../auth/index.ts', () => {
    return jest.fn().mockImplementation(() => ({
        ready: jest.fn().mockResolvedValue({access_token: 'access_token'}),
        get: jest.fn().mockResolvedValue({dwsid: 'dw-session-123'})
    }))
})

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_AGENTS
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>

const sessionInitEndpoint = '/shopper/shopper-agents/'

const PARAMETERS = {
    organizationId: 'f_ecom_zzrf_001'
} as const

const createOptions = <Mut extends ShopperAgentsMutation>(
    body: Argument<Client[Mut]> extends {body: infer B} ? B : undefined
): Argument<Client[Mut]> => ({parameters: PARAMETERS, body} as Argument<Client[Mut]>)

const sessionInitRequest = {
    sessionInitKey: 'aPrx.0rn0R1k7G.PtUUXh6S90_rMvqsYhpDZlNpyYsLsTm8KYLodM3flsRBbCD'
}

describe('Shopper Agents mutation hooks', () => {
    beforeEach(() => nock.cleanAll())

    test('`postSessionInit` succeeds with 202 response', async () => {
        const options = createOptions<'postSessionInit'>(sessionInitRequest)
        // Mock endpoint - 202 response with no body
        mockMutationEndpoints(sessionInitEndpoint, undefined, 202)

        const {result} = renderHookWithProviders(() => ({
            mutation: useShopperAgentsMutation('postSessionInit')
        }))

        // Do mutation
        act(() => result.current.mutation.mutate(options))
        await waitAndExpectSuccess(() => result.current.mutation)
        // 202 Accepted returns undefined/no response body
        expect(result.current.mutation.data).toBeUndefined()
    })
})
