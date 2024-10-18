/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import StoreLocatorModal from '@salesforce/retail-react-app/app/components/store-locator-modal/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {rest} from 'msw'

const mockStoresData = [
    {
        address1: '162 University Ave',
        city: 'Palo Alto',
        countryCode: 'US',
        distance: 0.0,
        distanceUnit: 'km',
        id: '00041',
        latitude: 37.189396,
        longitude: -121.705327,
        name: 'Palo Alto Store',
        posEnabled: false,
        postalCode: '94301',
        stateCode: 'CA',
        storeHours: 'THIS IS ENGLISH STORE HOURS',
        storeLocatorEnabled: true,
        c_countryCodeValue: 'US'
    },
    {
        address1: 'Holstenstraße 1',
        city: 'Kiel',
        countryCode: 'DE',
        distance: 8847.61,
        distanceUnit: 'km',
        id: '00031',
        inventoryId: 'inventory_m_store_store23',
        latitude: 54.3233,
        longitude: 10.1394,
        name: 'Kiel Electronics Store',
        phone: '+49 431 123456',
        posEnabled: false,
        postalCode: '24103',
        storeHours:
            'Monday 9 AM–7 PM\nTuesday 9 AM–7 PM\nWednesday 9 AM–7 PM\nThursday 9 AM–8 PM\nFriday 9 AM–7 PM\nSaturday 9 AM–6 PM\nSunday Closed',
        storeLocatorEnabled: true
    },
    {
        address1: 'Heiligengeiststraße 2',
        city: 'Oldenburg',
        countryCode: 'DE',
        distance: 8873.75,
        distanceUnit: 'km',
        id: '00036',
        inventoryId: 'inventory_m_store_store28',
        latitude: 53.1445,
        longitude: 8.2146,
        name: 'Oldenburg Tech Depot',
        phone: '+49 441 876543',
        posEnabled: false,
        postalCode: '26121',
        storeHours:
            'Monday 10 AM–7 PM\nTuesday 10 AM–7 PM\nWednesday 10 AM–7 PM\nThursday 10 AM–8 PM\nFriday 10 AM–7 PM\nSaturday 10 AM–6 PM\nSunday Closed',
        storeLocatorEnabled: true
    },
    {
        address1: 'Obernstraße 2',
        city: 'Bremen',
        countryCode: 'DE',
        distance: 8904.18,
        distanceUnit: 'km',
        id: '00011',
        inventoryId: 'inventory_m_store_store2',
        latitude: 53.0765,
        longitude: 8.8085,
        name: 'Bremen Tech Store',
        phone: '+49 421 234567',
        posEnabled: false,
        postalCode: '28195',
        storeHours:
            'Monday 10 AM–7 PM\nTuesday 10 AM–7 PM\nWednesday 10 AM–7 PM\nThursday 10 AM–8 PM\nFriday 10 AM–7 PM\nSaturday 10 AM–6 PM\nSunday Closed',
        storeLocatorEnabled: true
    },
    {
        address1: 'Sögestraße 40',
        city: 'Bremen',
        countryCode: 'DE',
        distance: 8904.19,
        distanceUnit: 'km',
        id: '00026',
        inventoryId: 'inventory_m_store_store18',
        latitude: 53.0758,
        longitude: 8.8072,
        name: 'Bremen Tech World',
        phone: '+49 421 567890',
        posEnabled: false,
        postalCode: '28195',
        storeHours:
            'Monday 9 AM–8 PM\nTuesday 9 AM–8 PM\nWednesday 9 AM–8 PM\nThursday 9 AM–9 PM\nFriday 9 AM–8 PM\nSaturday 9 AM–7 PM\nSunday Closed',
        storeLocatorEnabled: true
    },
    {
        address1: 'Jungfernstieg 12',
        city: 'Hamburg',
        countryCode: 'DE',
        distance: 8910.05,
        distanceUnit: 'km',
        id: '00005',
        inventoryId: 'inventory_m_store_store5',
        latitude: 53.553405,
        longitude: 9.992196,
        name: 'Hamburg Electronics Outlet',
        phone: '+49 40 444444444',
        posEnabled: false,
        postalCode: '20354',
        storeHours:
            'Monday 10 AM–8 PM\nTuesday 10 AM–8 PM\nWednesday 10 AM–8 PM\nThursday 10 AM–9 PM\nFriday 10 AM–8 PM\nSaturday 10 AM–7 PM\nSunday Closed',
        storeLocatorEnabled: true
    },
    {
        address1: 'Große Straße 40',
        city: 'Osnabrück',
        countryCode: 'DE',
        distance: 8942.1,
        distanceUnit: 'km',
        id: '00037',
        inventoryId: 'inventory_m_store_store29',
        latitude: 52.2799,
        longitude: 8.0472,
        name: 'Osnabrück Tech Mart',
        phone: '+49 541 654321',
        posEnabled: false,
        postalCode: '49074',
        storeHours:
            'Monday 10 AM–7 PM\nTuesday 10 AM–7 PM\nWednesday 10 AM–7 PM\nThursday 10 AM–8 PM\nFriday 10 AM–7 PM\nSaturday 10 AM–6 PM\nSunday Closed',
        storeLocatorEnabled: true
    },
    {
        address1: 'Kröpeliner Straße 48',
        city: 'Rostock',
        countryCode: 'DE',
        distance: 8945.47,
        distanceUnit: 'km',
        id: '00032',
        inventoryId: 'inventory_m_store_store24',
        latitude: 54.0899,
        longitude: 12.1349,
        name: 'Rostock Tech Store',
        phone: '+49 381 234567',
        posEnabled: false,
        postalCode: '18055',
        storeHours:
            'Monday 10 AM–7 PM\nTuesday 10 AM–7 PM\nWednesday 10 AM–7 PM\nThursday 10 AM–8 PM\nFriday 10 AM–7 PM\nSaturday 10 AM–6 PM\nSunday Closed',
        storeLocatorEnabled: true
    },
    {
        address1: 'Kennedyplatz 7',
        city: 'Essen',
        countryCode: 'DE',
        distance: 8969.09,
        distanceUnit: 'km',
        id: '00013',
        inventoryId: 'inventory_m_store_store4',
        latitude: 51.4566,
        longitude: 7.0125,
        name: 'Essen Electronics Depot',
        phone: '+49 201 456789',
        posEnabled: false,
        postalCode: '45127',
        storeHours:
            'Monday 10 AM–7 PM\nTuesday 10 AM–7 PM\nWednesday 10 AM–7 PM\nThursday 10 AM–8 PM\nFriday 10 AM–7 PM\nSaturday 10 AM–6 PM\nSunday Closed',
        storeLocatorEnabled: true
    },
    {
        address1: 'Kettwiger Straße 17',
        city: 'Essen',
        countryCode: 'DE',
        distance: 8969.13,
        distanceUnit: 'km',
        id: '00030',
        inventoryId: 'inventory_m_store_store22',
        latitude: 51.4556,
        longitude: 7.0116,
        name: 'Essen Tech Hub',
        phone: '+49 201 654321',
        posEnabled: false,
        postalCode: '45127',
        storeHours:
            'Monday 10 AM–7 PM\nTuesday 10 AM–7 PM\nWednesday 10 AM–7 PM\nThursday 10 AM–8 PM\nFriday 10 AM–7 PM\nSaturday 10 AM–6 PM\nSunday Closed',
        storeLocatorEnabled: true
    }
]
const mockStores = {
    limit: 10,
    data: mockStoresData,
    offset: 0,
    total: 30
}

describe('StoreLocatorModal', () => {
    test('renders without crashing', () => {
        global.server.use(
            rest.get('*/shopper-stores/v1/organizations/*', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json(mockStores))
            })
        )
        expect(() => {
            renderWithProviders(<StoreLocatorModal />)
        }).not.toThrow()
    })
})
