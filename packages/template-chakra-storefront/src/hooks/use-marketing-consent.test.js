/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {renderHook, act} from '@testing-library/react'
import {useMarketingConsent} from './use-marketing-consent'
import {CONSENT_STATUS, CONSENT_CHANNELS, CONSENT_TAGS} from '../constants/marketing-consent'
import {
    useShopperConsent,
    useShopperConsentMutation
} from '@salesforce/commerce-sdk-react/hooks/ShopperConsents'

// Mock ShopperConsents hooks
const mockFetchConsentItems = jest.fn()
const mockSubmitConsent = jest.fn()

jest.mock('@salesforce/commerce-sdk-react/hooks/ShopperConsents', () => ({
    useShopperConsent: jest.fn(() => ({
        data: null,
        isLoading: false,
        error: null,
        fetchConsentItems: mockFetchConsentItems
    })),
    useShopperConsentMutation: jest.fn(() => ({
        isLoading: false,
        error: null,
        submitConsent: mockSubmitConsent
    }))
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
        site: {id: mockSiteId},
        locale: {id: mockLocale}
    })
}))

jest.mock('../utils/logger-instance', () => ({
    error: jest.fn()
}))

// Create typed mock references
const mockUseShopperConsent = jest.mocked(useShopperConsent)
const mockUseShopperConsentMutation = jest.mocked(useShopperConsentMutation)

const mockSiteId = 'test-site'
const mockLocale = 'en-US'

const mockApiResponse = {
    data: [
        {
            subscriptionId: 'mock-api-newsletter',
            contactPointValue: 'mock-api@test.com',
            channel: CONSENT_CHANNELS.EMAIL,
            status: CONSENT_STATUS.OPT_IN,
            title: 'Mock Promotion Newsletter',
            subtitle: 'Promotion from Mock',
            tags: [CONSENT_TAGS.HOMEPAGE_BANNER, CONSENT_TAGS.USER_PROFILE]
        },
        {
            subscriptionId: 'mock-weekly-newsletter',
            contactPointValue: 'mock-test@test.com',
            channel: CONSENT_CHANNELS.EMAIL,
            status: CONSENT_STATUS.OPT_IN,
            title: 'Mock Weekly Newsletter',
            subtitle: 'Get our weekly newsletter with the latest updates.',
            tags: [CONSENT_TAGS.HOMEPAGE_BANNER, CONSENT_TAGS.USER_PROFILE]
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
    beforeEach(() => {
        mockFetchConsentItems.mockReset()
        mockSubmitConsent.mockReset()
        mockUseShopperConsent.mockClear()
        mockUseShopperConsentMutation.mockClear()
    })

    describe('fetchConsentItems', () => {
        test('returns API data on successful fetch', async () => {
            mockFetchConsentItems.mockResolvedValueOnce(mockApiResponse)

            const {result} = renderHook(() => useMarketingConsent())

            let fetchResult
            await act(async () => {
                fetchResult = await result.current.fetchConsentItems(CONSENT_TAGS.HOMEPAGE_BANNER)
            })

            expect(fetchResult).toEqual(mockApiResponse)
            expect(mockFetchConsentItems).toHaveBeenCalledWith(CONSENT_TAGS.HOMEPAGE_BANNER)
        })

        test('returns stub data when API fails', async () => {
            const error = new Error('API Error')
            mockFetchConsentItems.mockRejectedValueOnce(error)

            const {result} = renderHook(() => useMarketingConsent())

            let fetchResult
            await act(async () => {
                fetchResult = await result.current.fetchConsentItems(CONSENT_TAGS.HOMEPAGE_BANNER)
            })

            expect(mockFetchConsentItems).toHaveBeenCalledWith(CONSENT_TAGS.HOMEPAGE_BANNER)
            expect(fetchResult.data).toHaveLength(3)
            // Should return the submit stub data
            expect(fetchResult.data[0]).toEqual(
                expect.objectContaining({
                    subscriptionId: 'weekly-newsletter',
                    contactPointValue: 'test@test.com'
                })
            )
        })

        test('calls fetchConsentItems with correct parameters', async () => {
            mockFetchConsentItems.mockResolvedValueOnce(mockApiResponse)

            const {result} = renderHook(() => useMarketingConsent())

            await act(async () => {
                await result.current.fetchConsentItems(CONSENT_TAGS.HOMEPAGE_BANNER)
            })

            expect(mockFetchConsentItems).toHaveBeenCalledWith(CONSENT_TAGS.HOMEPAGE_BANNER)
        })

        test('calls fetchConsentItems without tags when not provided', async () => {
            mockFetchConsentItems.mockResolvedValueOnce(mockApiResponse)

            const {result} = renderHook(() => useMarketingConsent())

            await act(async () => {
                await result.current.fetchConsentItems()
            })

            expect(mockFetchConsentItems).toHaveBeenCalledWith(undefined)
        })
    })

    describe('submitConsent', () => {
        const mockConsentItem = {
            subscriptionId: 'weekly-newsletter',
            contactPointValue: 'user@test.com',
            channel: CONSENT_CHANNELS.EMAIL,
            status: CONSENT_STATUS.OPT_IN
        }

        test('returns API response on successful submission', async () => {
            mockSubmitConsent.mockResolvedValueOnce(mockSubmitResponse)

            const {result} = renderHook(() => useMarketingConsent())

            let submitResult
            await act(async () => {
                submitResult = await result.current.submitConsent(mockConsentItem)
            })

            expect(submitResult).toEqual(mockSubmitResponse)
            expect(mockSubmitConsent).toHaveBeenCalledWith(mockConsentItem)
        })

        test('calls submitConsent with correct parameters', async () => {
            mockSubmitConsent.mockResolvedValueOnce(mockSubmitResponse)

            const {result} = renderHook(() => useMarketingConsent())

            await act(async () => {
                await result.current.submitConsent(mockConsentItem)
            })

            expect(mockSubmitConsent).toHaveBeenCalledWith(mockConsentItem)
        })

        test('returns stub data when API fails', async () => {
            const error = new Error('Submit Error')
            mockSubmitConsent.mockRejectedValueOnce(error)

            const {result} = renderHook(() => useMarketingConsent())

            let submitResult
            await act(async () => {
                submitResult = await result.current.submitConsent(mockConsentItem)
            })

            // Should return the submit stub data
            expect(submitResult).toEqual(
                expect.objectContaining({
                    subscriptionId: 'weekly-newsletter',
                    status: CONSENT_STATUS.OPT_IN
                })
            )
            expect(mockSubmitConsent).toHaveBeenCalledWith(mockConsentItem)
        })
    })

    describe('loading and error states', () => {
        test('reflects loading state from consent items hook', () => {
            mockUseShopperConsent.mockReturnValueOnce({
                data: null,
                isLoading: true,
                error: null,
                fetchConsentItems: mockFetchConsentItems
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.isLoading).toBe(true)
        })

        test('reflects loading state from create consent hook', () => {
            mockUseShopperConsentMutation.mockReturnValueOnce({
                isLoading: true,
                error: null,
                submitConsent: mockSubmitConsent
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.isLoading).toBe(true)
        })

        test('reflects error state from consent items hook', () => {
            mockUseShopperConsent.mockReturnValueOnce({
                data: null,
                isLoading: false,
                error: 'Fetch Error',
                fetchConsentItems: mockFetchConsentItems
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.error).toBe('Fetch Error')
        })

        test('reflects error state from create consent hook', () => {
            mockUseShopperConsentMutation.mockReturnValueOnce({
                isLoading: false,
                error: 'Create Error',
                submitConsent: mockSubmitConsent
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.error).toBe('Create Error')
        })

        test('combines loading states from both hooks', () => {
            mockUseShopperConsent.mockReturnValueOnce({
                data: null,
                isLoading: true,
                error: null,
                fetchConsentItems: mockFetchConsentItems
            })

            mockUseShopperConsentMutation.mockReturnValueOnce({
                isLoading: false,
                error: null,
                submitConsent: mockSubmitConsent
            })

            const {result} = renderHook(() => useMarketingConsent())

            expect(result.current.isLoading).toBe(true)
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

    describe('hook configuration', () => {
        test('configures ShopperConsents hooks with correct parameters', () => {
            renderHook(() => useMarketingConsent())

            expect(mockUseShopperConsent).toHaveBeenCalledWith({
                organizationId: 'test-org-id',
                siteId: mockSiteId,
                locale: mockLocale
            })

            expect(mockUseShopperConsentMutation).toHaveBeenCalledWith({
                organizationId: 'test-org-id',
                siteId: mockSiteId,
                locale: mockLocale
            })
        })
    })
})
