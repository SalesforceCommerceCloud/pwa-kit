/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook, waitFor} from '@testing-library/react'
import useDataCloud from '@salesforce/retail-react-app/app/hooks/use-datacloud'
import {useDNT} from '@salesforce/commerce-sdk-react'
import {
    mockLoginViewPageEventDNT,
    mockSearchParam,
    mockGloveSearchResult,
    mockCategorySearchParams,
    mockRecommendationIds
} from '@salesforce/retail-react-app/app/mocks/datacloud-mock-data'
import {
    mockProduct,
    mockCategory,
    mockSearchResults,
    mockRecommenderDetails
} from '@salesforce/retail-react-app/app/hooks/einstein-mock-data'
import {getConfig as getConfigOriginal} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useCustomerType as useCustomerTypeOriginal} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer as useCurrentCustomerOriginal} from '@salesforce/retail-react-app/app/hooks/use-current-customer'

const dataCloudConfig = {
    app: {
        dataCloudAPI: {
            appSourceId: '7ae070a6-f4ec-4def-a383-d9cacc3f20a1',
            tenantId: 'g82wgnrvm-ywk9dggrrw8mtggy.pc-rnd'
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
const mockWebEventsAppSourceIdPost = jest.fn(() => Promise.resolve())
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

    test('returns noop functions if dataCloudConfig has empty strings', async () => {
        const emptyConfig = {
            app: {
                dataCloudAPI: {
                    appSourceId: '',
                    tenantId: ''
                },
                defaultSite: 'test-site'
            }
        }
        getConfigOriginal.mockReturnValueOnce(emptyConfig)
        const {result} = renderHook(() => useDataCloud())
        expect(result.current.sendViewPage).toBeInstanceOf(Function)
        expect(result.current.sendViewProduct).toBeInstanceOf(Function)
        expect(result.current.sendViewCategory).toBeInstanceOf(Function)
        expect(result.current.sendViewSearchResults).toBeInstanceOf(Function)
        expect(result.current.sendViewRecommendations).toBeInstanceOf(Function)
        // Should be noop async functions
        await Promise.all([
            expect(result.current.sendViewPage()).resolves.toBeUndefined(),
            expect(result.current.sendViewProduct()).resolves.toBeUndefined(),
            expect(result.current.sendViewCategory()).resolves.toBeUndefined(),
            expect(result.current.sendViewSearchResults()).resolves.toBeUndefined(),
            expect(result.current.sendViewRecommendations()).resolves.toBeUndefined()
        ])
    })

    test('returns noop functions if dataCloudConfig does not exist', async () => {
        const noConfig = {app: {}}
        getConfigOriginal.mockReturnValueOnce(noConfig)
        const {result} = renderHook(() => useDataCloud())
        expect(result.current.sendViewPage).toBeInstanceOf(Function)
        expect(result.current.sendViewProduct).toBeInstanceOf(Function)
        expect(result.current.sendViewCategory).toBeInstanceOf(Function)
        expect(result.current.sendViewSearchResults).toBeInstanceOf(Function)
        expect(result.current.sendViewRecommendations).toBeInstanceOf(Function)
        await Promise.all([
            expect(result.current.sendViewPage()).resolves.toBeUndefined(),
            expect(result.current.sendViewProduct()).resolves.toBeUndefined(),
            expect(result.current.sendViewCategory()).resolves.toBeUndefined(),
            expect(result.current.sendViewSearchResults()).resolves.toBeUndefined(),
            expect(result.current.sendViewRecommendations()).resolves.toBeUndefined()
        ])
    })

    test('sends partyIdentification event for registered user', async () => {
        // Registered user: isRegistered true, customerId present
        const {result} = renderHook(() => useDataCloud())
        result.current.sendViewPage('/login')
        await waitFor(() => {
            const call = mockWebEventsAppSourceIdPost.mock.calls[0][0]
            const partyEvent = call.events.find((e) => e.eventType === 'partyIdentification')
            expect(partyEvent).toEqual(
                expect.objectContaining({
                    IDName: 'CC_REGISTERED_CUSTOMER_ID',
                    IDType: 'CC_REGISTERED_CUSTOMER_ID',
                    category: 'Profile',
                    creationEventId: expect.any(String),
                    customerId: 1234567890,
                    dateTime: expect.any(String),
                    deviceId: 1234567890,
                    eventId: expect.any(String),
                    eventType: 'partyIdentification',
                    guestId: 'guest-usid',
                    internalOrganizationId: 'RefArch',
                    party: 1234567890,
                    partyIdentificationId: 1234567890,
                    sessionId: expect.any(String),
                    siteId: 'RefArch',
                    userId: 1234567890
                })
            )
        })
    })

    test('sends partyIdentification event for guest user', async () => {
        // Guest user: isRegistered false, customerId undefined
        useCustomerTypeOriginal.mockReturnValueOnce({isRegistered: false})
        useCurrentCustomerOriginal.mockReturnValueOnce({data: {}})
        const {result} = renderHook(() => useDataCloud())
        result.current.sendViewPage('/login')
        await waitFor(() => {
            const call = mockWebEventsAppSourceIdPost.mock.calls[0][0]
            const partyEvent = call.events.find((e) => e.eventType === 'partyIdentification')
            expect(partyEvent).toEqual(
                expect.objectContaining({
                    IDName: 'CC_USID',
                    IDType: 'CC_USID',
                    category: 'Profile',
                    creationEventId: expect.any(String),
                    dateTime: expect.any(String),
                    deviceId: 'guest-usid',
                    eventId: expect.any(String),
                    eventType: 'partyIdentification',
                    guestId: 'guest-usid',
                    internalOrganizationId: 'RefArch',
                    party: 'guest-usid',
                    partyIdentificationId: 'guest-usid',
                    sessionId: 'mockCookieValue',
                    siteId: 'RefArch',
                    userId: 'guest-usid'
                })
            )
        })
    })

    test('sendViewPage', async () => {
        const {result} = renderHook(() => useDataCloud())
        expect(result.current).toBeDefined()
        result.current.sendViewPage('/login')
        await waitFor(() => {
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(
                expect.objectContaining({
                    events: expect.arrayContaining([
                        expect.objectContaining({
                            eventType: 'identity',
                            category: 'Profile',
                            customerId: 1234567890,
                            firstName: 'John',
                            lastName: 'Smith',
                            sourceUrl: '/login'
                        }),
                        expect.objectContaining({
                            eventType: 'partyIdentification',
                            category: 'Profile',
                            customerId: 1234567890,
                            IDName: 'CC_REGISTERED_CUSTOMER_ID',
                            IDType: 'CC_REGISTERED_CUSTOMER_ID'
                        }),
                        expect.objectContaining({
                            eventType: 'userEngagement',
                            category: 'Engagement',
                            customerId: 1234567890,
                            interactionName: 'page-view',
                            sourceUrl: '/login'
                        })
                    ])
                })
            )
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
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(
                expect.objectContaining({
                    events: expect.arrayContaining([
                        expect.objectContaining({
                            eventType: 'identity',
                            category: 'Profile',
                            customerId: 1234567890,
                            firstName: 'John',
                            lastName: 'Smith'
                        }),
                        expect.objectContaining({
                            eventType: 'partyIdentification',
                            category: 'Profile',
                            customerId: 1234567890,
                            IDName: 'CC_REGISTERED_CUSTOMER_ID',
                            IDType: 'CC_REGISTERED_CUSTOMER_ID'
                        }),
                        expect.objectContaining({
                            eventType: 'contactPointEmail',
                            category: 'Profile',
                            customerId: 1234567890,
                            email: 'johnsmith@salesforce.com'
                        }),
                        expect.objectContaining({
                            eventType: 'catalog',
                            category: 'Engagement',
                            customerId: 1234567890,
                            id: '56736828M',
                            type: 'Product',
                            interactionName: 'catalog-object-view-start'
                        })
                    ])
                })
            )
        })
    })

    test('sendViewCategory with no email', async () => {
        useCurrentCustomerOriginal.mockReturnValue({
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
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(
                expect.objectContaining({
                    events: expect.arrayContaining([
                        expect.objectContaining({
                            eventType: 'identity',
                            category: 'Profile',
                            customerId: 1234567890,
                            firstName: 'John',
                            lastName: 'Smith'
                        }),
                        expect.objectContaining({
                            eventType: 'partyIdentification',
                            category: 'Profile',
                            customerId: 1234567890,
                            IDName: 'CC_REGISTERED_CUSTOMER_ID',
                            IDType: 'CC_REGISTERED_CUSTOMER_ID'
                        }),
                        expect.objectContaining({
                            eventType: 'catalog',
                            category: 'Engagement',
                            customerId: 1234567890,
                            id: '25752986M',
                            type: 'Product',
                            categoryId: 'mens-accessories-ties',
                            interactionName: 'catalog-object-impression'
                        })
                    ])
                })
            )
        })
    })

    test('sendViewSearchResults with no email', async () => {
        const {result} = renderHook(() => useDataCloud())
        expect(result.current).toBeDefined()
        result.current.sendViewSearchResults(mockSearchParam, mockGloveSearchResult)
        await waitFor(() => {
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(
                expect.objectContaining({
                    events: expect.arrayContaining([
                        expect.objectContaining({
                            eventType: 'identity',
                            category: 'Profile',
                            customerId: 1234567890,
                            firstName: 'John',
                            lastName: 'Smith'
                        }),
                        expect.objectContaining({
                            eventType: 'partyIdentification',
                            category: 'Profile',
                            customerId: 1234567890,
                            IDName: 'CC_REGISTERED_CUSTOMER_ID',
                            IDType: 'CC_REGISTERED_CUSTOMER_ID'
                        }),
                        expect.objectContaining({
                            eventType: 'catalog',
                            category: 'Engagement',
                            customerId: 1234567890,
                            id: 'TG250M',
                            type: 'Product',
                            searchResultTitle: 'oxford glove',
                            interactionName: 'catalog-object-impression'
                        })
                    ])
                })
            )
        })
    })

    test('sendViewRecommendations with non email', async () => {
        const {result} = renderHook(() => useDataCloud())
        expect(result.current).toBeDefined()
        result.current.sendViewRecommendations(mockRecommenderDetails, mockRecommendationIds)
        await waitFor(() => {
            expect(mockWebEventsAppSourceIdPost).toHaveBeenCalledWith(
                expect.objectContaining({
                    events: expect.arrayContaining([
                        expect.objectContaining({
                            eventType: 'identity',
                            category: 'Profile',
                            customerId: 1234567890,
                            firstName: 'John',
                            lastName: 'Smith'
                        }),
                        expect.objectContaining({
                            eventType: 'partyIdentification',
                            category: 'Profile',
                            customerId: 1234567890,
                            IDName: 'CC_REGISTERED_CUSTOMER_ID',
                            IDType: 'CC_REGISTERED_CUSTOMER_ID'
                        }),
                        expect.objectContaining({
                            eventType: 'catalog',
                            category: 'Engagement',
                            customerId: 1234567890,
                            id: '11111111',
                            type: 'Product',
                            interactionName: 'catalog-object-impression',
                            personalizationId: 'testRecommender'
                        }),
                        expect.objectContaining({
                            eventType: 'catalog',
                            category: 'Engagement',
                            customerId: 1234567890,
                            id: '22222222',
                            type: 'Product',
                            interactionName: 'catalog-object-impression',
                            personalizationId: 'testRecommender'
                        })
                    ])
                })
            )
        })
    })
})
