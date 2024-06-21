/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import StoreLocatorContent from '@salesforce/retail-react-app/app/components/store-locator-modal/store-locator-content'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {waitFor, screen} from '@testing-library/react'
import PropTypes from 'prop-types'
import {useForm} from 'react-hook-form'
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
        inventoryId: 'inventory_m_store_store13',
        latitude: 49.4077,
        longitude: 8.6908,
        name: 'Heidelberg Tech Mart',
        phone: '+49 6221 123456',
        posEnabled: false,
        postalCode: '69117',
        storeHours:
            'Monday 10 AM–7 PM\nTuesday 10 AM–7 PM\nWednesday 10 AM–7 PM\nThursday 10 AM–8 PM\nFriday 10 AM–7 PM\nSaturday 10 AM–6 PM\nSunday Closed',
        storeLocatorEnabled: true
    }
]

const WrapperComponent = ({storesInfo}) => {
    const form = useForm({
        mode: 'onChange',
        reValidateMode: 'onChange',
        defaultValues: {
            countryCode: 'DE',
            postalCode: '10178'
        }
    })

    return (
        <StoreLocatorContent
            form={form}
            storesInfo={storesInfo}
            searchStoresParams={{
                postalCode: '10178',
                countryCode: 'DE'
            }}
            setSearchStoresParams={jest.fn()}
        />
    )
}
WrapperComponent.propTypes = {
    storesInfo: PropTypes.array
}

describe('StoreLocatorContent', () => {
    test('renders without crashing', () => {
        expect(() => {
            renderWithProviders(<WrapperComponent storesInfo={mockSearchStoresData} />)
        }).not.toThrow()
    })

    test('Expected information exists', async () => {
        renderWithProviders(<WrapperComponent storesInfo={mockSearchStoresData} />)

        await waitFor(async () => {
            const findButton = screen.getByRole('button', {name: /Find/i})
            const useMyLocationButton = screen.getByRole('button', {name: /Use My Location/i})
            const descriptionFindAStore = screen.getByText(/Find a Store/i)
            const viewing = screen.getByText(/Viewing stores within 100 miles/i)

            expect(findButton).toBeInTheDocument()
            expect(useMyLocationButton).toBeInTheDocument()
            expect(descriptionFindAStore).toBeInTheDocument()
            expect(viewing).toBeInTheDocument()
        })
    })

    test('No stores text exists', async () => {
        renderWithProviders(<WrapperComponent storesInfo={[]} />)

        await waitFor(async () => {
            const noLocations = screen.getByText(/Sorry, there are no locations in this area/i)

            expect(noLocations).toBeInTheDocument()
        })
    })
})
