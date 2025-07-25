/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {useMarketingConsent} from './use-marketing-consent'
import {CONSENT_STATUS, CONSENT_CHANNELS, CONSENT_TAGS} from '../constants/marketing-consent'
import fetchMock from 'jest-fetch-mock'

// Mock dependencies
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useAccessToken: () => ({
        getTokenWhenReady: jest.fn().mockResolvedValue('mock-token')
    })
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: () => ({
        commerceAPI: {
            parameters: {
                organizationId: 'test-org-id'
            }
        }
    })
}))

jest.mock('./use-multi-site', () => ({
    __esModule: true,
    default: () => ({
        site: {id: 'test-site'},
        locale: {id: 'en-US'}
    })
}))

jest.mock('../utils/logger-instance', () => ({
    error: jest.fn()
}))

const mockApiResponse = {
    data: [
        {
            subscriptionId: 'api-newsletter',
            contactPointValue: 'api@test.com',
            channel: CONSENT_CHANNELS.EMAIL,
            status: CONSENT_STATUS.OPT_IN,
            title: 'API Newsletter',
            subtitle: 'Newsletter from API',
            tags: [CONSENT_TAGS.HOMEPAGE_BANNER]
        },
        {
            subscriptionId: 'weekly-newsletter',
            contactPointValue: 'test@test.com',
            channel: CONSENT_CHANNELS.EMAIL,
            status: CONSENT_STATUS.OPT_IN,
            title: 'Weekly Newsletter',
            subtitle: 'Get our weekly newsletter with the latest updates.',
            tags: [CONSENT_TAGS.HOMEPAGE_BANNER, CONSENT_TAGS.USER_PROFILE]
        },
        {
            subscriptionId: 'weekly-newsletter',
            contactPointValue: '+1 555 321 7654',
            channel: CONSENT_CHANNELS.WHATSAPP,
            status: CONSENT_STATUS.OPT_IN,
            title: 'Weekly Newsletter',
            subtitle: 'Get our weekly newsletter with the latest updates.',
            tags: [CONSENT_TAGS.USER_PROFILE]
        },
        {
            subscriptionId: 'promotional-offers',
            contactPointValue: '+1 555 123 4567',
            channel: CONSENT_CHANNELS.SMS,
            status: CONSENT_STATUS.OPT_OUT,
            title: 'Promotional Offers',
            subtitle: 'Receive special promotional offers.',
            tags: [CONSENT_TAGS.CHECKOUT_PAGE]
        }
    ]
}

const mockSubmitResponse = {
    subscriptionId: 'api-newsletter',
    contactPointValue: 'user@test.com',
    channel: CONSENT_CHANNELS.EMAIL,
    status: CONSENT_STATUS.OPT_IN,
    title: 'API Newsletter',
    subtitle: 'Newsletter from API',
    tags: [CONSENT_TAGS.HOMEPAGE_BANNER]
}

describe('useMarketingConsent', () => {
    const fetchOriginal = global.fetch

    beforeEach(() => {
        global.fetch = fetchMock
        fetchMock.resetMocks()
    })

    afterAll(() => {
        global.fetch = fetchOriginal
    })

    describe('fetchConsentItems', () => {
        test('returns API data on successful fetch', async () => {
            fetchMock.mockResponseOnce(JSON.stringify(mockApiResponse))

            const {result} = renderHook(() => useMarketingConsent())

            let fetchResult
            await act(async () => {
                fetchResult = await result.current.fetchConsentItems('HOMEPAGE_BANNER')
            })

            expect(fetchResult).toEqual(mockApiResponse)
            expect(result.current.isLoading).toBe(false)
            expect(result.current.error).toBeNull()
        })

        test('returns stub data when API fails', async () => {
            fetchMock.mockRejectOnce(new Error('API Error'))

            const {result} = renderHook(() => useMarketingConsent())

            await act(async () => {
                try {
                    await result.current.fetchConsentItems('HOMEPAGE_BANNER')
                } catch (error) {
                    // Expected to throw
                }
            })

            expect(result.current.error).toBe('API Error')
        })

        test('includes tags in query params when provided', async () => {
            fetchMock.mockResponseOnce(JSON.stringify(mockApiResponse))

            const {result} = renderHook(() => useMarketingConsent())

            await act(async () => {
                await result.current.fetchConsentItems('HOMEPAGE_BANNER')
            })

            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining('tags=HOMEPAGE_BANNER'),
                expect.any(Object)
            )
        })

        test('excludes tags from query params when not provided', async () => {
            fetchMock.mockResponseOnce(JSON.stringify(mockApiResponse))

            const {result} = renderHook(() => useMarketingConsent())

            await act(async () => {
                await result.current.fetchConsentItems()
            })

            expect(fetchMock).toHaveBeenCalledWith(
                expect.not.stringContaining('tags='),
                expect.any(Object)
            )
        })

        test('returns stub data when API returns error status', async () => {
            fetchMock.mockResponseOnce('', {status: 404})

            const {result} = renderHook(() => useMarketingConsent())

            let fetchResult
            await act(async () => {
                fetchResult = await result.current.fetchConsentItems('HOMEPAGE_BANNER')
            })

            expect(fetchResult).toBeDefined()
            expect(fetchResult.data).toHaveLength(3) // stub data has 3 items
        })
    })

    describe('submitConsent', () => {
        const mockConsentItem = {
            subscriptionId: 'weekly-newsletter',
            contactPointValue: 'user@test.com',
            channel: CONSENT_CHANNELS.EMAIL,
            consent: CONSENT_STATUS.OPT_IN
        }

        test('returns API response on successful submission', async () => {
            fetchMock.mockResponseOnce(JSON.stringify(mockSubmitResponse))

            const {result} = renderHook(() => useMarketingConsent())

            let submitResult
            await act(async () => {
                submitResult = await result.current.submitConsent(mockConsentItem)
            })

            expect(submitResult).toEqual(mockSubmitResponse)
            expect(result.current.isLoading).toBe(false)
            expect(result.current.error).toBeNull()
        })

        test('sends correct request body', async () => {
            fetchMock.mockResponseOnce(JSON.stringify(mockSubmitResponse))

            const {result} = renderHook(() => useMarketingConsent())

            await act(async () => {
                await result.current.submitConsent(mockConsentItem)
            })

            expect(fetchMock).toHaveBeenCalledWith(
                expect.stringContaining('/subscriptions'),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        Authorization: 'Bearer mock-token',
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify(mockConsentItem)
                })
            )
        })

        test('returns stub data when API fails', async () => {
            fetchMock.mockRejectOnce(new Error('Submit Error'))

            const {result} = renderHook(() => useMarketingConsent())

            await act(async () => {
                try {
                    await result.current.submitConsent(mockConsentItem)
                } catch (error) {
                    // Expected to throw
                }
            })

            expect(result.current.error).toBe('Submit Error')
        })

        test('returns stub data when API returns error status', async () => {
            fetchMock.mockResponseOnce('', {status: 400})

            const {result} = renderHook(() => useMarketingConsent())

            let submitResult
            await act(async () => {
                submitResult = await result.current.submitConsent(mockConsentItem)
            })

            expect(submitResult).toEqual(
                expect.objectContaining({
                    subscriptionId: 'weekly-newsletter',
                    status: CONSENT_STATUS.OPT_IN
                })
            )
        })
    })

    describe('loading states', () => {
        test('sets loading state during fetchConsentItems', async () => {
            let resolvePromise
            const promise = new Promise((resolve) => {
                resolvePromise = resolve
            })
            fetchMock.mockReturnValueOnce(promise)

            const {result} = renderHook(() => useMarketingConsent())

            act(() => {
                result.current.fetchConsentItems('HOMEPAGE_BANNER')
            })

            expect(result.current.isLoading).toBe(true)

            await act(async () => {
                resolvePromise(new Response(JSON.stringify(mockApiResponse)))
            })

            expect(result.current.isLoading).toBe(false)
        })

        test('sets loading state during submitConsent', async () => {
            let resolvePromise
            const promise = new Promise((resolve) => {
                resolvePromise = resolve
            })
            fetchMock.mockReturnValueOnce(promise)

            const {result} = renderHook(() => useMarketingConsent())

            act(() => {
                result.current.submitConsent({
                    subscriptionId: 'test',
                    contactPointValue: 'test@test.com',
                    channel: CONSENT_CHANNELS.EMAIL,
                    consent: CONSENT_STATUS.OPT_IN
                })
            })

            expect(result.current.isLoading).toBe(true)

            await act(async () => {
                resolvePromise(new Response(JSON.stringify(mockSubmitResponse)))
            })

            expect(result.current.isLoading).toBe(false)
        })
    })

    describe('initial state', () => {
        test('returns correct initial values', () => {
            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.isLoading).toBe(false)
            expect(result.current.error).toBeNull()
            expect(typeof result.current.fetchConsentItems).toBe('function')
            expect(typeof result.current.submitConsent).toBe('function')
        })
    })
})
