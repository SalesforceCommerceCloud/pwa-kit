/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {act} from '@testing-library/react'
import {ShopperContextsTypes} from 'commerce-sdk-isomorphic'
import nock from 'nock'

import * as queries from './query'
import {ApiClients, Argument} from '../types'
import {ShopperContextsMutation, useShopperContextsMutation} from './mutation'
import {
    mockMutationEndpoints,
    mockQueryEndpoint,
    renderHookWithProviders,
    waitAndExpectError,
    waitAndExpectSuccess
} from '../../test-utils'

jest.mock('../../auth/index.ts', () => {
    return jest.fn().mockImplementation(() => ({
        ready: jest.fn().mockResolvedValue({access_token: 'access_token'})
    }))
})

type Client = ApiClients['shopperContexts']

const contextEndpoint = '/shopper/shopper-context/'

const PARAMETERS = {
    usid: '8e257caf-8c08-4b5b-a7d6-190f1ce33be5'
} as const
/** Options object that can be used for all query endpoints. */
const queryOptions = {parameters: PARAMETERS}

const createOptions = <Mut extends ShopperContextsMutation>(
    body: Argument<Client[Mut]> extends {body: infer B} ? B : undefined
): Argument<Client[Mut]> => ({...queryOptions, body})

const newContext: ShopperContextsTypes.ShopperContext = {
    effectiveDateTime: '2020-12-20T00:00:00Z',
    customQualifiers: {
        deviceType: 'mobile'
    },
    assignmentQualifiers: {
        store: 'vancouver'
    }
}

const updatedContext: ShopperContextsTypes.ShopperContext = {
    effectiveDateTime: '2021-12-20T00:00:00Z',
    customQualifiers: {
        deviceType: 'desktop'
    },
    assignmentQualifiers: {
        store: 'boston'
    }
}

describe('Shopper Contexts mutation hooks', () => {
    beforeEach(() => nock.cleanAll())
    test('`createShopperContext` invalidates cache on success', async () => {
        const options = createOptions<'createShopperContext'>(newContext)
        mockQueryEndpoint(contextEndpoint, {error: true}, 400) // getShopperContext
        // TODO: Fix this mock to return `undefined` once the `commerce-sdk-isomorphic` has its
        // raml updated.
        mockMutationEndpoints(contextEndpoint, {}, 201) // createShopperContext

        const {result /* rerender, */} = renderHookWithProviders(() => ({
            mutation: useShopperContextsMutation('createShopperContext'),
            query: queries.useShopperContext(queryOptions)
        }))

        // 1. Populate cache with initial data
        expect(result.current.query.error).toBeNull()
        await waitAndExpectError(() => result.current.query)
        expect(result.current.query.error).toHaveProperty('response')

        // 2. Do creation mutation
        act(() => result.current.mutation.mutate(options))
        await waitAndExpectSuccess(() => result.current.mutation)
        expect(result.current.mutation.data).toEqual({})

        // FIXME: This probably isn't working because the createContext API has changes to not
        // return a value, but the SDK is returning a value anyway (empty string maybe) which is
        // updating the cache, so it's not going into the `isFetching` state.
        // assertInvalidateQuery(result.current.query, undefined)

        // 3. Re-render to validate the created resource was added to cache
        // mockQueryEndpoint(contextEndpoint, data)
        // await rerender()
        // await waitForValueToChange(() => result.current.query)
        // assertUpdateQuery(result.current.query, data)
    })

    test('`updateShopperContext` updates cache on success', async () => {
        const options = createOptions<'updateShopperContext'>(updatedContext)
        mockQueryEndpoint(contextEndpoint, newContext) // getShopperContext
        mockMutationEndpoints(contextEndpoint, updatedContext) // createShopperContext

        const {result} = renderHookWithProviders(() => ({
            mutation: useShopperContextsMutation('updateShopperContext'),
            query: queries.useShopperContext(queryOptions)
        }))

        // 1. Populate cache with initial data
        expect(result.current.query.error).toBeNull()
        await waitAndExpectSuccess(() => result.current.query)
        expect(result.current.query.data).toEqual(newContext)

        // 2. Do update mutation
        act(() => result.current.mutation.mutate(options))
        await waitAndExpectSuccess(() => result.current.mutation)
        expect(result.current.mutation.data).toEqual(updatedContext)
    })

    test('`deleteShopperContext` removes cache on success', async () => {
        const options = createOptions<'deleteShopperContext'>(undefined)
        mockQueryEndpoint(contextEndpoint, newContext) // getShopperContext
        mockMutationEndpoints(contextEndpoint, updatedContext) // createShopperContext

        const {result} = renderHookWithProviders(() => ({
            mutation: useShopperContextsMutation('deleteShopperContext'),
            query: queries.useShopperContext(queryOptions)
        }))

        // 1. Populate cache with initial data
        expect(result.current.query.error).toBeNull()
        await waitAndExpectSuccess(() => result.current.query)
        expect(result.current.query.data).toEqual(newContext)

        // 2. Do delete mutation
        act(() => result.current.mutation.mutate(options))
        await waitAndExpectSuccess(() => result.current.mutation)
        expect(result.current.mutation.data).toBeUndefined()
    })
})
