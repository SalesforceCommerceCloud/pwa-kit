/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook, waitFor} from '@testing-library/react'
import useDataCloud from '@salesforce/retail-react-app/app/hooks/use-datacloud'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useDNT} from '@salesforce/commerce-sdk-react'
import {
    mockLoginViewPageEvent,
    mockViewProductEvent,
    mockViewCategoryEvent,
    mockViewSearchResultsEvent,
    mockViewRecommendationsEvent,
    mockSearchParam,
    mockGloveSearchResult,
    mockCategorySearchParams,
    mockRecommendationIds,
    mockLoginViewPageEventDNT
} from '@salesforce/retail-react-app/app/mocks/datacloud-mock-data'
import {
    mockProduct,
    mockCategory,
    mockSearchResults,
    mockRecommenderDetails
} from '@salesforce/retail-react-app/app/hooks/einstein-mock-data'

const dataCloudConfig = {
    app: {
        dataCloudAPI: {
            appSourceId: 'f22ae831-ac03-4bf6-afc1-3a0b19f1ea8e',
            tenantId: 'mmydmztgh04dczjzmnsw0zd0g8.pc-rnd'
        },
        defaultSite: 'test-site'
    }
}

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: jest.fn(() => dataCloudConfig)
    }
})

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useUsid: () => {
            return {
                getUsidWhenReady: jest.fn(() => {
                    return 'guest-usid'
                })
            }
        },
        useCustomerType: jest.fn(() => {
            return {isRegistered: true}
        }),
        useDNT: jest.fn(() => {
            return {effectiveDnt: false}
        })
    }
})

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => ({
    useCurrentCustomer: jest.fn(() => {
        return {
            data: {
                customerId: 1234567890,
                firstName: 'John',
                lastName: 'Smith',
                email: 'johnsmith@salesforce.com'
            }
        }
    })
}))
jest.mock('js-cookie', () => ({
    get: jest.fn(() => 'mockCookieValue')
}))
const mockWebEventsAppSourceIdPost = jest.fn()
jest.mock('@salesforce/cc-datacloud-typescript', () => {
    return {
        initDataCloudSdk: () => {
            return {
                webEventsAppSourceIdPost: mockWebEventsAppSourceIdPost
            }
        }
    }
})

const mockUseContext = jest.fn().mockImplementation(() => ({site: {id: 'RefArch'}}))
React.useContext = mockUseContext
describe('useDataCloud', function () {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('sendViewPage', async () => {
        const {result} = renderHook(() => useDataCloud())
        expect(result.current).toBeDefined()
        result.current.sendViewPage('/login')
        await waitFor(() => {
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(mockLoginViewPageEvent)
        })
    })

    test('sendViewPage does not send Profile event when DNT is enabled', async () => {
        useDNT.mockReturnValueOnce({
            effectiveDnt: true
        })
        const {result} = renderHook(() => useDataCloud())
        expect(result.current).toBeDefined()
        result.current.sendViewPage('/login')
        await waitFor(() => {
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(mockLoginViewPageEventDNT)
        })
    })

    test('sendViewProduct', async () => {
        const {result} = renderHook(() => useDataCloud())
        expect(result.current).toBeDefined()
        result.current.sendViewProduct(mockProduct)
        await waitFor(() => {
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(mockViewProductEvent)
        })
    })

    test('sendViewCategory with no email', async () => {
        useCurrentCustomer.mockReturnValue({
            data: {
                customerId: 1234567890,
                firstName: 'John',
                lastName: 'Smith'
            }
        })
        const {result} = renderHook(() => useDataCloud())
        expect(result.current).toBeDefined()
        result.current.sendViewCategory(mockCategorySearchParams, mockCategory, mockSearchResults)
        await waitFor(() => {
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(mockViewCategoryEvent)
        })
    })

    test('sendViewSearchResults with no email', async () => {
        const {result} = renderHook(() => useDataCloud())
        expect(result.current).toBeDefined()
        result.current.sendViewSearchResults(mockSearchParam, mockGloveSearchResult)
        await waitFor(() => {
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(mockViewSearchResultsEvent)
        })
    })

    test('sendViewRecommendations with non email', async () => {
        const {result} = renderHook(() => useDataCloud())
        expect(result.current).toBeDefined()
        result.current.sendViewRecommendations(mockRecommenderDetails, mockRecommendationIds)
        await waitFor(() => {
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(mockViewRecommendationsEvent)
        })
    })
})
