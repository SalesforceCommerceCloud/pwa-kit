/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import StoresList from '@salesforce/retail-react-app/app/components/store-locator-modal/stores-list'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {waitFor, screen, fireEvent} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {Accordion} from '@salesforce/retail-react-app/app/components/shared/ui'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

const mockSearchStoresData = [
    {
        address1: 'Kirchgasse 12',
        city: 'Wiesbaden',
        countryCode: 'DE',
        distance: 0.74,
        distanceUnit: 'km',
        id: '00019',
        inventoryId: 'inventory_m_store_store11',
        latitude: 50.0826,
        longitude: 8.24,
        name: 'Wiesbaden Tech Depot',
        phone: '+49 611 876543',
        posEnabled: false,
        postalCode: '65185',
        storeHours: 'Monday 9 AM to 7 PM',
        storeLocatorEnabled: true
    },
    {
        address1: 'Schaumainkai 63',
        city: 'Frankfurt am Main',
        countryCode: 'DE',
        distance: 30.78,
        distanceUnit: 'km',
        id: '00002',
        inventoryId: 'inventory_m_store_store4',
        latitude: 50.097416,
        longitude: 8.669059,
        name: 'Frankfurt Electronics Store',
        phone: '+49 69 111111111',
        posEnabled: false,
        postalCode: '60596',
        storeHours:
            'Monday 10 AM–6 PM\nTuesday 10 AM–6 PM\nWednesday 10 AM–6 PM\nThursday 10 AM–9 PM\nFriday 10 AM–6 PM\nSaturday 10 AM–6 PM\nSunday 10 AM–6 PM',
        storeLocatorEnabled: true
    },
    {
        address1: 'Löhrstraße 87',
        city: 'Koblenz',
        countryCode: 'DE',
        distance: 55.25,
        distanceUnit: 'km',
        id: '00035',
        inventoryId: 'inventory_m_store_store27',
        latitude: 50.3533,
        longitude: 7.5946,
        name: 'Koblenz Electronics Store',
        phone: '+49 261 123456',
        posEnabled: false,
        postalCode: '56068',
        storeHours:
            'Monday 9 AM–7 PM\nTuesday 9 AM–7 PM\nWednesday 9 AM–7 PM\nThursday 9 AM–8 PM\nFriday 9 AM–7 PM\nSaturday 9 AM–6 PM\nSunday Closed',
        storeLocatorEnabled: true
    },
    {
        address1: 'Hauptstraße 47',
        city: 'Heidelberg',
        countryCode: 'DE',
        distance: 81.1,
        distanceUnit: 'km',
        id: '00021',
        latitude: 49.4077,
        longitude: 8.6908,
        name: 'Store with no inventoryId',
        phone: '+49 6221 123456',
        posEnabled: false,
        postalCode: '69117',
        storeHours:
            'Monday 10 AM–7 PM\nTuesday 10 AM–7 PM\nWednesday 10 AM–7 PM\nThursday 10 AM–8 PM\nFriday 10 AM–7 PM\nSaturday 10 AM–6 PM\nSunday Closed',
        storeLocatorEnabled: true
    }
]

describe('StoresList', () => {
    test('renders without crashing', () => {
        expect(() => {
            renderWithProviders(
                <Accordion>
                    <StoresList storesInfo={mockSearchStoresData} />
                </Accordion>
            )
        }).not.toThrow()
    })

    test('Expected information exists', async () => {
        renderWithProviders(
            <Accordion>
                <StoresList storesInfo={mockSearchStoresData} />
            </Accordion>
        )

        expect(screen.queryAllByRole('radio')).toHaveLength(mockSearchStoresData.length)

        await waitFor(async () => {
            mockSearchStoresData.forEach((store) => {
                const storeName = screen.getByText(store.name)
                const storeAddress = screen.getByText(store.address1)
                const storeCityAndPostalCode = screen.getByText(
                    `${store.city}, ${store.postalCode}`
                )
                const storeDistance = screen.getByText(
                    `${store.distance} ${store.distanceUnit} away`
                )
                const storePhoneNumber = screen.getByText(`Phone: ${store.phone}`)

                expect(storeName).toBeInTheDocument()
                expect(storeAddress).toBeInTheDocument()
                expect(storeCityAndPostalCode).toBeInTheDocument()
                expect(storeDistance).toBeInTheDocument()
                expect(storePhoneNumber).toBeInTheDocument()
            })
        })
    })

    test('Clicking View More opens store hours', async () => {
        renderWithProviders(
            <Accordion>
                <StoresList storesInfo={mockSearchStoresData} />
            </Accordion>
        )

        await waitFor(async () => {
            const viewMoreButtons = screen.getAllByRole('button', {name: /View More/i})

            // Click on the first button
            await userEvent.click(viewMoreButtons[0])

            const aStoreOpenHours = screen.getByText(/Monday\s*9\s*AM\s*to\s*7\s*PM/i)
            expect(aStoreOpenHours).toBeInTheDocument()
        })
    })

    test('Is sorted by distance away', async () => {
        renderWithProviders(
            <Accordion>
                <StoresList storesInfo={mockSearchStoresData} />
            </Accordion>
        )
        await waitFor(async () => {
            const numbers = [
                screen.getByText(/\s*0\.74\s*km\s*away\s*/),
                screen.getByText(/\s*30\.78\s*km\s*away\s*/),
                screen.getByText(/\s*55\.25\s*km\s*away\s*/),
                screen.getByText(/\s*81\.1\s*km\s*away\s*/)
            ]

            // Check that the numbers are in the document
            numbers.forEach((number) => {
                expect(number).toBeInTheDocument()
            })

            // Check that the numbers are in the correct order
            const numberTexts = numbers.map((number) => number.textContent)
            expect(numberTexts).toEqual([
                '0.74 km away',
                '30.78 km away',
                '55.25 km away',
                '81.1 km away'
            ])
            // Check that the numbers are in the correct visual order
            const positions = numbers.map((number) => number.getBoundingClientRect().top)
            expect(positions).toEqual([...positions].sort((a, b) => a - b))
        })
    })

    test('Can select store', async () => {
        renderWithProviders(
            <Accordion>
                <StoresList storesInfo={mockSearchStoresData} />
            </Accordion>
        )

        await waitFor(async () => {
            const {id, name, inventoryId} = mockSearchStoresData[1]
            const radioButton = screen.getByDisplayValue(id)
            fireEvent.click(radioButton)

            const expectedStoreInfo = {id, name, inventoryId}
            expect(localStorage.getItem(`store_${mockConfig.app.defaultSite}`)).toEqual(
                JSON.stringify(expectedStoreInfo)
            )
        })
    })
})
