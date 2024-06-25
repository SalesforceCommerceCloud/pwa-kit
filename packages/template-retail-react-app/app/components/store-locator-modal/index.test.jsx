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
import {screen, waitFor} from '@testing-library/react'

const mockStoresData = [
    {
        "address1": "162 University Ave",
        "city": "Palo Alto",
        "countryCode": "US",
        "distance": 0.00,
        "distanceUnit": "km",
        "id": "00041",
        "latitude": 37.189396,
        "longitude": -121.705327,
        "name": "Palo Alto Store",
        "posEnabled": false,
        "postalCode": "94301",
        "stateCode": "CA",
        "storeHours": "THIS IS ENGLISH STORE HOURS",
        "storeLocatorEnabled": true,
        "c_countryCodeValue": "US"
    },
    {
        "address1": "Holstenstraße 1",
        "city": "Kiel",
        "countryCode": "DE",
        "distance": 8847.61,
        "distanceUnit": "km",
        "id": "00031",
        "inventoryId": "inventory_m_store_store23",
        "latitude": 54.323300,
        "longitude": 10.139400,
        "name": "Kiel Electronics Store",
        "phone": "+49 431 123456",
        "posEnabled": false,
        "postalCode": "24103",
        "storeHours": "Monday 9 AM–7 PM\nTuesday 9 AM–7 PM\nWednesday 9 AM–7 PM\nThursday 9 AM–8 PM\nFriday 9 AM–7 PM\nSaturday 9 AM–6 PM\nSunday Closed",
        "storeLocatorEnabled": true
    },
    {
        "address1": "Heiligengeiststraße 2",
        "city": "Oldenburg",
        "countryCode": "DE",
        "distance": 8873.75,
        "distanceUnit": "km",
        "id": "00036",
        "inventoryId": "inventory_m_store_store28",
        "latitude": 53.144500,
        "longitude": 8.214600,
        "name": "Oldenburg Tech Depot",
        "phone": "+49 441 876543",
        "posEnabled": false,
        "postalCode": "26121",
        "storeHours": "Monday 10 AM–7 PM\nTuesday 10 AM–7 PM\nWednesday 10 AM–7 PM\nThursday 10 AM–8 PM\nFriday 10 AM–7 PM\nSaturday 10 AM–6 PM\nSunday Closed",
        "storeLocatorEnabled": true
    },
    {
        "address1": "Obernstraße 2",
        "city": "Bremen",
        "countryCode": "DE",
        "distance": 8904.18,
        "distanceUnit": "km",
        "id": "00011",
        "inventoryId": "inventory_m_store_store2",
        "latitude": 53.076500,
        "longitude": 8.808500,
        "name": "Bremen Tech Store",
        "phone": "+49 421 234567",
        "posEnabled": false,
        "postalCode": "28195",
        "storeHours": "Monday 10 AM–7 PM\nTuesday 10 AM–7 PM\nWednesday 10 AM–7 PM\nThursday 10 AM–8 PM\nFriday 10 AM–7 PM\nSaturday 10 AM–6 PM\nSunday Closed",
        "storeLocatorEnabled": true
    },
    {
        "address1": "Sögestraße 40",
        "city": "Bremen",
        "countryCode": "DE",
        "distance": 8904.19,
        "distanceUnit": "km",
        "id": "00026",
        "inventoryId": "inventory_m_store_store18",
        "latitude": 53.075800,
        "longitude": 8.807200,
        "name": "Bremen Tech World",
        "phone": "+49 421 567890",
        "posEnabled": false,
        "postalCode": "28195",
        "storeHours": "Monday 9 AM–8 PM\nTuesday 9 AM–8 PM\nWednesday 9 AM–8 PM\nThursday 9 AM–9 PM\nFriday 9 AM–8 PM\nSaturday 9 AM–7 PM\nSunday Closed",
        "storeLocatorEnabled": true
    },
    {
        "address1": "Jungfernstieg 12",
        "city": "Hamburg",
        "countryCode": "DE",
        "distance": 8910.05,
        "distanceUnit": "km",
        "id": "00005",
        "inventoryId": "inventory_m_store_store5",
        "latitude": 53.553405,
        "longitude": 9.992196,
        "name": "Hamburg Electronics Outlet",
        "phone": "+49 40 444444444",
        "posEnabled": false,
        "postalCode": "20354",
        "storeHours": "Monday 10 AM–8 PM\nTuesday 10 AM–8 PM\nWednesday 10 AM–8 PM\nThursday 10 AM–9 PM\nFriday 10 AM–8 PM\nSaturday 10 AM–7 PM\nSunday Closed",
        "storeLocatorEnabled": true
    },
    {
        "address1": "Große Straße 40",
        "city": "Osnabrück",
        "countryCode": "DE",
        "distance": 8942.10,
        "distanceUnit": "km",
        "id": "00037",
        "inventoryId": "inventory_m_store_store29",
        "latitude": 52.279900,
        "longitude": 8.047200,
        "name": "Osnabrück Tech Mart",
        "phone": "+49 541 654321",
        "posEnabled": false,
        "postalCode": "49074",
        "storeHours": "Monday 10 AM–7 PM\nTuesday 10 AM–7 PM\nWednesday 10 AM–7 PM\nThursday 10 AM–8 PM\nFriday 10 AM–7 PM\nSaturday 10 AM–6 PM\nSunday Closed",
        "storeLocatorEnabled": true
    },
    {
        "address1": "Kröpeliner Straße 48",
        "city": "Rostock",
        "countryCode": "DE",
        "distance": 8945.47,
        "distanceUnit": "km",
        "id": "00032",
        "inventoryId": "inventory_m_store_store24",
        "latitude": 54.089900,
        "longitude": 12.134900,
        "name": "Rostock Tech Store",
        "phone": "+49 381 234567",
        "posEnabled": false,
        "postalCode": "18055",
        "storeHours": "Monday 10 AM–7 PM\nTuesday 10 AM–7 PM\nWednesday 10 AM–7 PM\nThursday 10 AM–8 PM\nFriday 10 AM–7 PM\nSaturday 10 AM–6 PM\nSunday Closed",
        "storeLocatorEnabled": true
    },
    {
        "address1": "Kennedyplatz 7",
        "city": "Essen",
        "countryCode": "DE",
        "distance": 8969.09,
        "distanceUnit": "km",
        "id": "00013",
        "inventoryId": "inventory_m_store_store4",
        "latitude": 51.456600,
        "longitude": 7.012500,
        "name": "Essen Electronics Depot",
        "phone": "+49 201 456789",
        "posEnabled": false,
        "postalCode": "45127",
        "storeHours": "Monday 10 AM–7 PM\nTuesday 10 AM–7 PM\nWednesday 10 AM–7 PM\nThursday 10 AM–8 PM\nFriday 10 AM–7 PM\nSaturday 10 AM–6 PM\nSunday Closed",
        "storeLocatorEnabled": true
    },
    {
        "address1": "Kettwiger Straße 17",
        "city": "Essen",
        "countryCode": "DE",
        "distance": 8969.13,
        "distanceUnit": "km",
        "id": "00030",
        "inventoryId": "inventory_m_store_store22",
        "latitude": 51.455600,
        "longitude": 7.011600,
        "name": "Essen Tech Hub",
        "phone": "+49 201 654321",
        "posEnabled": false,
        "postalCode": "45127",
        "storeHours": "Monday 10 AM–7 PM\nTuesday 10 AM–7 PM\nWednesday 10 AM–7 PM\nThursday 10 AM–8 PM\nFriday 10 AM–7 PM\nSaturday 10 AM–6 PM\nSunday Closed",
        "storeLocatorEnabled": true
    },
    {
        "address1": "Huestraße 23",
        "city": "Bochum",
        "countryCode": "DE",
        "distance": 8975.79,
        "distanceUnit": "km",
        "id": "00017",
        "inventoryId": "inventory_m_store_store8",
        "latitude": 51.481800,
        "longitude": 7.216500,
        "name": "Bochum Gadget Store",
        "phone": "+49 234 890123",
        "posEnabled": false,
        "postalCode": "44787",
        "storeHours": "Monday 10 AM–7 PM\nTuesday 10 AM–7 PM\nWednesday 10 AM–7 PM\nThursday 10 AM–8 PM\nFriday 10 AM–7 PM\nSaturday 10 AM–6 PM\nSunday Closed",
        "storeLocatorEnabled": true
    },
    {
        "address1": "Königsallee 16",
        "city": "Düsseldorf",
        "countryCode": "DE",
        "distance": 8978.68,
        "distanceUnit": "km",
        "id": "00008",
        "inventoryId": "inventory_m_store_store8",
        "latitude": 51.225402,
        "longitude": 6.776313,
        "name": "Düsseldorf Electronics Shop",
        "phone": "+49 211 777777777",
        "posEnabled": false,
        "postalCode": "40212",
        "storeHours": "Monday 10 AM–8 PM\nTuesday 10 AM–8 PM\nWednesday 10 AM–8 PM\nThursday 10 AM–9 PM\nFriday 10 AM–8 PM\nSaturday 10 AM–7 PM\nSunday Closed",
        "storeLocatorEnabled": true
    },
    {
        "address1": "Schadowstraße 60",
        "city": "Düsseldorf",
        "countryCode": "DE",
        "distance": 8978.83,
        "distanceUnit": "km",
        "id": "00029",
        "inventoryId": "inventory_m_store_store21",
        "latitude": 51.225400,
        "longitude": 6.779800,
        "name": "Düsseldorf Electronics Mart",
        "phone": "+49 211 789012",
        "posEnabled": false,
        "postalCode": "40212",
        "storeHours": "Monday 9 AM–7 PM\nTuesday 9 AM–7 PM\nWednesday 9 AM–7 PM\nThursday 9 AM–8 PM\nFriday 9 AM–7 PM\nSaturday 9 AM–6 PM\nSunday Closed",
        "storeLocatorEnabled": true
    },
    {
        "address1": "Westenhellweg 95",
        "city": "Dortmund",
        "countryCode": "DE",
        "distance": 8983.75,
        "distanceUnit": "km",
        "id": "00010",
        "inventoryId": "inventory_m_store_store1",
        "latitude": 51.514940,
        "longitude": 7.466000,
        "name": "Dortmund Digital Market",
        "phone": "+49 231 567890",
        "posEnabled": false,
        "postalCode": "44137",
        "storeHours": "Monday 9 AM–7 PM\nTuesday 9 AM–7 PM\nWednesday 9 AM–7 PM\nThursday 9 AM–8 PM\nFriday 9 AM–7 PM\nSaturday 9 AM–6 PM\nSunday Closed",
        "storeLocatorEnabled": true
    },
    {
        "address1": "Ostenhellweg 12",
        "city": "Dortmund",
        "countryCode": "DE",
        "distance": 8983.79,
        "distanceUnit": "km",
        "id": "00027",
        "inventoryId": "inventory_m_store_store19",
        "latitude": 51.514500,
        "longitude": 7.466100,
        "name": "Dortmund Gadget Store",
        "phone": "+49 231 876543",
        "posEnabled": false,
        "postalCode": "44135",
        "storeHours": "Monday 10 AM–7 PM\nTuesday 10 AM–7 PM\nWednesday 10 AM–7 PM\nThursday 10 AM–8 PM\nFriday 10 AM–7 PM\nSaturday 10 AM–6 PM\nSunday Closed",
        "storeLocatorEnabled": true
    }
]
const mockStoresTotalIsHigherThanLimit = {
    limit: 15,
    data: mockStoresData,
    offset: 0,
    total: 30
}

const mockStoresTotalIsEqualToLimit = {
    limit: 15,
    data: mockStoresData,
    offset: 0,
    total: 15
}

describe('StoreLocatorModal', () => {

    test('renders without crashing', () => {
        global.server.use(
            rest.get('*/shopper-stores/v1/organizations/*', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json(mockStoresTotalIsHigherThanLimit))
            })
        )
        const onClose = jest.fn()
        expect(() => {
            renderWithProviders(<StoreLocatorModal onClose={onClose} />)
        }).not.toThrow()
    })

    test('Load More button exists when total stores is higher than display limit', async () => {
        global.server.use(
            rest.get('*/shopper-stores/v1/organizations/*', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json(mockStoresTotalIsHigherThanLimit))
            })
        )
        screen.debug();

        const onClose = jest.fn()
        renderWithProviders(<StoreLocatorModal onClose={onClose} />)
        await waitFor(async () => {
            const findButton = screen.getByRole('button', {name: /Find/i})
            const aStore = screen.getByText(/162 University Ave/i)
            const loadMore = screen.getByText(/Load More/i)
            expect(findButton).toBeInTheDocument()
            expect(aStore).toBeInTheDocument()
            expect(loadMore).toBeInTheDocument()
        })
    })

    test('Load More button exists when total stores is higher than display limit', async () => {
        global.server.use(
            rest.get('*/shopper-stores/v1/organizations/*', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json(mockStoresTotalIsEqualToLimit))
            })
        )
        const onClose = jest.fn()
        renderWithProviders(<StoreLocatorModal onClose={onClose} />)
        await waitFor(() => {
            const loadMore = screen.queryByText(/Load More/i)
            expect(loadMore).not.toBeInTheDocument()
        })
    })


})
