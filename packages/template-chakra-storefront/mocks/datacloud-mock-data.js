/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {expect} from '@jest/globals'

export const mockLoginViewPageEvent = {
    events: [
        expect.objectContaining({
            guestId: 'guest-usid',
            siteId: 'RefArch',
            sessionId: expect.any(String),
            deviceId: expect.any(String),
            dateTime: expect.any(String),
            customerId: 1234567890,
            eventId: expect.any(String),
            eventType: 'identity',
            category: 'Profile',
            isAnonymous: 0,
            firstName: 'John',
            lastName: 'Smith',
            sourceUrl: '/login'
        }),
        expect.objectContaining({
            guestId: 'guest-usid',
            siteId: 'RefArch',
            sessionId: expect.any(String),
            deviceId: expect.any(String),
            dateTime: expect.any(String),
            customerId: 1234567890,
            eventId: expect.any(String),
            eventType: 'userEngagement',
            category: 'Engagement',
            interactionName: 'page-view',
            sourceUrl: '/login'
        })
    ]
}

export const mockLoginViewPageEventDNT = {
    events: [
        expect.objectContaining({
            guestId: '__DNT__',
            siteId: 'RefArch',
            sessionId: '__DNT__',
            deviceId: '__DNT__',
            dateTime: expect.any(String),
            customerId: '__DNT__',
            customerNo: '__DNT__',
            eventId: expect.any(String),
            eventType: 'userEngagement',
            category: 'Engagement',
            interactionName: 'page-view',
            sourceUrl: '/login'
        })
    ]
}

export const mockViewProductEvent = {
    events: [
        expect.objectContaining({
            guestId: 'guest-usid',
            siteId: 'RefArch',
            sessionId: expect.any(String),
            deviceId: expect.any(String),
            dateTime: expect.any(String),
            customerId: 1234567890,
            eventId: expect.any(String),
            eventType: 'identity',
            category: 'Profile',
            isAnonymous: 0,
            firstName: 'John',
            lastName: 'Smith'
        }),
        expect.objectContaining({
            guestId: 'guest-usid',
            siteId: 'RefArch',
            sessionId: expect.any(String),
            deviceId: expect.any(String),
            dateTime: expect.any(String),
            customerId: 1234567890,
            eventId: expect.any(String),
            eventType: 'contactPointEmail',
            category: 'Profile',
            email: 'johnsmith@salesforce.com'
        }),
        expect.objectContaining({
            guestId: 'guest-usid',
            siteId: 'RefArch',
            sessionId: expect.any(String),
            deviceId: expect.any(String),
            dateTime: expect.any(String),
            customerId: 1234567890,
            eventId: expect.any(String),
            eventType: 'catalog',
            category: 'Engagement',
            id: '56736828M',
            type: 'Product',
            webStoreId: 'pwa',
            interactionName: 'catalog-object-view-start'
        })
    ]
}

export const mockCategorySearchParams = {
    limit: 25,
    offset: 0,
    sort: 'best-matches'
}

export const mockViewCategoryEvent = {
    events: [
        expect.objectContaining({
            guestId: 'guest-usid',
            siteId: 'RefArch',
            sessionId: expect.any(String),
            deviceId: expect.any(String),
            dateTime: expect.any(String),
            customerId: 1234567890,
            eventId: expect.any(String),
            eventType: 'identity',
            category: 'Profile',
            isAnonymous: 0,
            firstName: 'John',
            lastName: 'Smith'
        }),
        expect.objectContaining({
            guestId: 'guest-usid',
            siteId: 'RefArch',
            sessionId: expect.any(String),
            deviceId: expect.any(String),
            dateTime: expect.any(String),
            customerId: 1234567890,
            eventId: expect.any(String),
            eventType: 'catalog',
            category: 'Engagement',
            searchResultTitle: undefined,
            searchResultPosition: 0,
            searchResultPageNumber: 1,
            id: '25752986M',
            type: 'Product',
            webStoreId: 'pwa',
            categoryId: 'mens-accessories-ties',
            interactionName: 'catalog-object-impression'
        }),
        expect.objectContaining({
            guestId: 'guest-usid',
            siteId: 'RefArch',
            sessionId: expect.any(String),
            deviceId: expect.any(String),
            dateTime: expect.any(String),
            customerId: 1234567890,
            eventId: expect.any(String),
            eventType: 'catalog',
            category: 'Engagement',
            searchResultTitle: undefined,
            searchResultPosition: 0,
            searchResultPageNumber: 1,
            id: '25752235M',
            type: 'Product',
            webStoreId: 'pwa',
            categoryId: 'mens-accessories-ties',
            interactionName: 'catalog-object-impression'
        }),
        expect.objectContaining({
            guestId: 'guest-usid',
            siteId: 'RefArch',
            sessionId: expect.any(String),
            deviceId: expect.any(String),
            dateTime: expect.any(String),
            customerId: 1234567890,
            eventId: expect.any(String),
            eventType: 'catalog',
            category: 'Engagement',
            searchResultTitle: undefined,
            searchResultPosition: 0,
            searchResultPageNumber: 1,
            id: '25752218M',
            type: 'Product',
            webStoreId: 'pwa',
            categoryId: 'mens-accessories-ties',
            interactionName: 'catalog-object-impression'
        }),
        expect.objectContaining({
            guestId: 'guest-usid',
            siteId: 'RefArch',
            sessionId: expect.any(String),
            deviceId: expect.any(String),
            dateTime: expect.any(String),
            customerId: 1234567890,
            eventId: expect.any(String),
            eventType: 'catalog',
            category: 'Engagement',
            searchResultTitle: undefined,
            searchResultPosition: 0,
            searchResultPageNumber: 1,
            id: '25752981M',
            type: 'Product',
            webStoreId: 'pwa',
            categoryId: 'mens-accessories-ties',
            interactionName: 'catalog-object-impression'
        })
    ]
}

export const mockSearchParam = {
    limit: 25,
    offset: 0,
    q: 'oxford glove',
    sort: 'best-matches'
}

export const mockGloveSearchResult = {
    limit: 1,
    hits: [
        {
            currency: 'GBP',
            hitType: 'master',
            image: {
                alt: "Men's Oxford Gloves, , large",
                disBaseLink:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb69853b8/images/large/TG250_206.jpg',
                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb69853b8/images/large/TG250_206.jpg',
                title: "Men's Oxford Gloves, "
            },
            price: 63.99,
            pricePerUnit: 63.99,
            priceRanges: [
                {
                    maxPrice: 63.99,
                    minPrice: 63.99,
                    pricebook: 'gbp-m-list-prices'
                }
            ],
            productId: 'TG250M',
            productName: "Men's Oxford Gloves",
            productType: {
                master: true
            },
            c_productUrl: 'https://pwa-kit.mobify-storefront.com/global/en-GB/product/TG250M'
        }
    ],
    query: 'oxford glove',
    refinements: [
        {
            attributeId: 'cgid',
            label: 'Category',
            values: [
                {
                    hitCount: 1,
                    label: 'Mens',
                    value: 'mens',
                    values: [
                        {
                            hitCount: 1,
                            label: 'Accessories',
                            value: 'mens-accessories',
                            values: [
                                {
                                    hitCount: 1,
                                    label: 'Gloves',
                                    value: 'mens-accessories-gloves'
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            attributeId: 'c_refinementColor',
            label: 'Colour',
            values: [
                {
                    hitCount: 0,
                    label: 'Beige',
                    presentationId: 'beige',
                    value: 'Beige'
                },
                {
                    hitCount: 0,
                    label: 'Black',
                    presentationId: 'black',
                    value: 'Black'
                }
            ]
        },
        {
            attributeId: 'price',
            label: 'Price',
            values: [
                {
                    hitCount: 1,
                    label: '£50 - £99.99',
                    value: '(50..100)'
                }
            ]
        }
    ],
    selectedSortingOption: 'best-matches',
    sortingOptions: [
        {
            id: 'best-matches',
            label: 'Best Matches'
        }
    ],
    offset: 0,
    total: 1
}

export const mockViewSearchResultsEvent = {
    events: [
        expect.objectContaining({
            guestId: 'guest-usid',
            siteId: 'RefArch',
            sessionId: expect.any(String),
            deviceId: expect.any(String),
            dateTime: expect.any(String),
            customerId: 1234567890,
            eventId: expect.any(String),
            eventType: 'identity',
            category: 'Profile',
            isAnonymous: 0,
            firstName: 'John',
            lastName: 'Smith'
        }),
        expect.objectContaining({
            guestId: 'guest-usid',
            siteId: 'RefArch',
            sessionId: expect.any(String),
            deviceId: expect.any(String),
            dateTime: expect.any(String),
            customerId: 1234567890,
            eventId: expect.any(String),
            eventType: 'catalog',
            category: 'Engagement',
            searchResultTitle: 'oxford glove',
            searchResultPosition: 0,
            searchResultPageNumber: 1,
            searchResultId: expect.any(String),
            id: 'TG250M',
            type: 'Product',
            webStoreId: 'pwa',
            interactionName: 'catalog-object-impression'
        })
    ]
}

export const mockRecommendationIds = [{id: '11111111'}, {id: '22222222'}]

export const mockViewRecommendationsEvent = {
    events: [
        expect.objectContaining({
            guestId: 'guest-usid',
            siteId: 'RefArch',
            sessionId: expect.any(String),
            deviceId: expect.any(String),
            dateTime: expect.any(String),
            customerId: 1234567890,
            eventId: expect.any(String),
            eventType: 'identity',
            category: 'Profile',
            isAnonymous: 0,
            firstName: 'John',
            lastName: 'Smith'
        }),
        expect.objectContaining({
            guestId: 'guest-usid',
            siteId: 'RefArch',
            sessionId: expect.any(String),
            deviceId: expect.any(String),
            dateTime: expect.any(String),
            customerId: 1234567890,
            eventId: expect.any(String),
            eventType: 'catalog',
            category: 'Engagement',
            id: '11111111',
            type: 'Product',
            webStoreId: 'pwa',
            interactionName: 'catalog-object-impression',
            personalizationId: 'testRecommender',
            personalizationContextId: '883360544021M'
        }),
        expect.objectContaining({
            guestId: 'guest-usid',
            siteId: 'RefArch',
            sessionId: expect.any(String),
            deviceId: expect.any(String),
            dateTime: expect.any(String),
            customerId: 1234567890,
            eventId: expect.any(String),
            eventType: 'catalog',
            category: 'Engagement',
            id: '22222222',
            type: 'Product',
            webStoreId: 'pwa',
            interactionName: 'catalog-object-impression',
            personalizationId: 'testRecommender',
            personalizationContextId: '883360544021M'
        })
    ]
}
