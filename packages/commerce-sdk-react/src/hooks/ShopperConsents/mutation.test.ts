/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {act, waitFor} from '@testing-library/react'
import {ShopperConsentsTypes} from 'commerce-sdk-isomorphic'
import nock from 'nock'
import {
    assertInvalidateQuery,
    mockMutationEndpoints,
    mockQueryEndpoint,
    renderHookWithProviders,
    waitAndExpectSuccess
} from '../../test-utils'
import {ShopperConsentsMutation, useShopperConsentsMutation} from '../ShopperConsents'
import {ApiClients, Argument} from '../types'
import * as queries from './query'
import {CLIENT_KEYS} from '../../constant'

jest.mock('../../auth/index.ts', () => {
    const {default: mockAuth} = jest.requireActual('../../auth/index.ts')
    mockAuth.prototype.ready = jest.fn().mockResolvedValue({access_token: 'access_token'})
    return mockAuth
})

const CLIENT_KEY = CLIENT_KEYS.SHOPPER_CONSENTS
type Client = NonNullable<ApiClients[typeof CLIENT_KEY]>
const consentsEndpoint = '/shopper/shopper-consents/'
/** All Shopper Consents parameters. Can be used for all endpoints, as unused params are ignored. */
const PARAMETERS = {
    siteId: 'RefArch'
} as const
/** Options object that can be used for all query endpoints. */
const queryOptions = {parameters: PARAMETERS}

const baseSubscriptionResponse: ShopperConsentsTypes.ConsentSubscriptionResponse = {
    data: [
        {
            subscriptionId: 'test-subscription',
            channels: ['email' as ShopperConsentsTypes.ChannelType],
            contactPointValue: 'test@example.com'
        }
    ]
}

type Mutation = ShopperConsentsMutation
/** Map of mutation method name to test options. */
type TestMap = {[Mut in Mutation]?: Argument<Client[Mut]>}
const testMap: TestMap = {
    updateSubscription: {
        parameters: PARAMETERS,
        body: {
            subscriptionId: 'test-subscription',
            channel: 'email',
            status: 'opt_in',
            contactPointValue: 'test@example.com'
        }
    },
    updateSubscriptions: {
        parameters: PARAMETERS,
        body: {
            subscriptions: [
                {
                    subscriptionId: 'test-subscription',
                    channel: 'email' as ShopperConsentsTypes.ChannelType,
                    status: 'opt_in' as ShopperConsentsTypes.ConsentStatus,
                    contactPointValue: 'test@example.com'
                }
            ]
        }
    }
}
// Type assertion is necessary because `Object.entries` is limited
type TestCase = [Mutation, NonNullable<TestMap[Mutation]>]
const testCases = Object.entries(testMap) as TestCase[]

describe('Shopper Consents mutations', () => {
    beforeEach(() => nock.cleanAll())
    test.each(testCases)('`%s` returns data on success', async (mutationName, options) => {
        mockMutationEndpoints(consentsEndpoint, {})
        const {result} = renderHookWithProviders(() => {
            return useShopperConsentsMutation(mutationName)
        })
        act(() => result.current.mutate(options))
        await waitAndExpectSuccess(() => result.current)
    })
})

describe('Cache update behavior', () => {
    describe('updateSubscription', () => {
        beforeEach(() => nock.cleanAll())

        test('invalidates `getSubscriptions` query', async () => {
            mockQueryEndpoint(consentsEndpoint, baseSubscriptionResponse)
            mockMutationEndpoints(consentsEndpoint, {})
            mockQueryEndpoint(consentsEndpoint, baseSubscriptionResponse)
            const {result} = renderHookWithProviders(() => {
                return {
                    query: queries.useSubscriptions(queryOptions),
                    mutation: useShopperConsentsMutation('updateSubscription')
                }
            })
            await waitAndExpectSuccess(() => result.current.query)
            const oldData = result.current.query.data

            act(() =>
                result.current.mutation.mutate({
                    parameters: PARAMETERS,
                    body: {
                        subscriptionId: 'test-subscription',
                        channel: 'email',
                        status: 'opt_out',
                        contactPointValue: 'test@example.com'
                    }
                })
            )
            await waitAndExpectSuccess(() => result.current.mutation)
            assertInvalidateQuery(result.current.query, oldData)
        })

        test('triggers refetch after cache invalidation', async () => {
            const updatedResponse: ShopperConsentsTypes.ConsentSubscriptionResponse = {
                data: [
                    {
                        subscriptionId: 'test-subscription',
                        channels: ['email' as ShopperConsentsTypes.ChannelType],
                        contactPointValue: 'test@example.com'
                    }
                ]
            }

            mockQueryEndpoint(consentsEndpoint, baseSubscriptionResponse)
            mockMutationEndpoints(consentsEndpoint, {})
            mockQueryEndpoint(consentsEndpoint, updatedResponse) // Refetch returns updated data

            const {result} = renderHookWithProviders(() => {
                return {
                    query: queries.useSubscriptions(queryOptions),
                    mutation: useShopperConsentsMutation('updateSubscription')
                }
            })
            await waitAndExpectSuccess(() => result.current.query)
            expect(result.current.query.data).toEqual(baseSubscriptionResponse)

            act(() =>
                result.current.mutation.mutate({
                    parameters: PARAMETERS,
                    body: {
                        subscriptionId: 'test-subscription',
                        channel: 'email',
                        status: 'opt_out',
                        contactPointValue: 'test@example.com'
                    }
                })
            )
            await waitAndExpectSuccess(() => result.current.mutation)

            // Wait for refetch to complete
            await waitAndExpectSuccess(() => result.current.query)
            // After refetch, data should be updated
            expect(result.current.query.data).toEqual(updatedResponse)
        })
    })

    describe('updateSubscriptions', () => {
        beforeEach(() => nock.cleanAll())

        test('invalidates `getSubscriptions` query', async () => {
            mockQueryEndpoint(consentsEndpoint, baseSubscriptionResponse)
            mockMutationEndpoints(consentsEndpoint, {})
            mockQueryEndpoint(consentsEndpoint, baseSubscriptionResponse)
            const {result} = renderHookWithProviders(() => {
                return {
                    query: queries.useSubscriptions(queryOptions),
                    mutation: useShopperConsentsMutation('updateSubscriptions')
                }
            })
            await waitAndExpectSuccess(() => result.current.query)
            const oldData = result.current.query.data

            act(() =>
                result.current.mutation.mutate({
                    parameters: PARAMETERS,
                    body: {
                        subscriptions: [
                            {
                                subscriptionId: 'test-subscription',
                                channel: 'email' as ShopperConsentsTypes.ChannelType,
                                status: 'opt_out' as ShopperConsentsTypes.ConsentStatus,
                                contactPointValue: 'test@example.com'
                            },
                            {
                                subscriptionId: 'test-subscription-2',
                                channel: 'sms' as ShopperConsentsTypes.ChannelType,
                                status: 'opt_in' as ShopperConsentsTypes.ConsentStatus,
                                contactPointValue: '+15551234567'
                            }
                        ]
                    }
                })
            )
            await waitAndExpectSuccess(() => result.current.mutation)
            assertInvalidateQuery(result.current.query, oldData)
        })

        test('ensures stale cache is not served after mutation', async () => {
            const staleResponse = baseSubscriptionResponse
            const freshResponse: ShopperConsentsTypes.ConsentSubscriptionResponse = {
                data: [
                    {
                        subscriptionId: 'test-subscription',
                        channels: ['email' as ShopperConsentsTypes.ChannelType],
                        contactPointValue: 'test@example.com'
                    },
                    {
                        subscriptionId: 'test-subscription-2',
                        channels: ['sms' as ShopperConsentsTypes.ChannelType],
                        contactPointValue: '+15551234567'
                    }
                ]
            }

            mockQueryEndpoint(consentsEndpoint, staleResponse)
            mockMutationEndpoints(consentsEndpoint, {})
            mockQueryEndpoint(consentsEndpoint, freshResponse) // Refetch returns fresh data

            const {result} = renderHookWithProviders(() => {
                return {
                    query: queries.useSubscriptions(queryOptions),
                    mutation: useShopperConsentsMutation('updateSubscriptions')
                }
            })

            // Initial fetch - get stale data
            await waitAndExpectSuccess(() => result.current.query)
            expect(result.current.query.data?.data).toHaveLength(1)

            // Perform mutation
            act(() =>
                result.current.mutation.mutate({
                    parameters: PARAMETERS,
                    body: {
                        subscriptions: [
                            {
                                subscriptionId: 'test-subscription',
                                channel: 'email' as ShopperConsentsTypes.ChannelType,
                                status: 'opt_out' as ShopperConsentsTypes.ConsentStatus,
                                contactPointValue: 'test@example.com'
                            },
                            {
                                subscriptionId: 'test-subscription-2',
                                channel: 'sms' as ShopperConsentsTypes.ChannelType,
                                status: 'opt_in' as ShopperConsentsTypes.ConsentStatus,
                                contactPointValue: '+15551234567'
                            }
                        ]
                    }
                })
            )
            await waitAndExpectSuccess(() => result.current.mutation)

            // Wait for refetch to complete with fresh data
            await waitFor(() => {
                expect(result.current.query.data?.data).toHaveLength(2)
            })
            expect(result.current.query.data).toEqual(freshResponse)
        })
    })
})
