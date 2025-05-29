/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor, within} from '@testing-library/react'
import {rest} from 'msw'
import {
    createPathWithDefaults,
    renderWithProviders
} from '@salesforce/retail-react-app/app/utils/test-utils'
import StoreLocator from '.'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

const mockStores = {
    limit: 4,
    data: [
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
            storeHours:
                'Monday 9 AM–7 PM\nTuesday 9 AM–7 PM\nWednesday 9 AM–7 PM\nThursday 9 AM–8 PM\nFriday 9 AM–7 PM\nSaturday 9 AM–6 PM\nSunday Closed',
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
    ],
    offset: 0,
    total: 4
}

const mockNoStores = {
    limit: 4,
    total: 0
}

const MockedComponent = () => {
    return (
        <div>
            <StoreLocator />
        </div>
    )
}

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
    window.history.pushState({}, 'Store locator', createPathWithDefaults('/store-locator'))
})
afterEach(() => {
    jest.resetModules()
    localStorage.clear()
    jest.clearAllMocks()
})

test('Allows customer to go to store locator page', async () => {
    global.server.use(
        rest.get(
            '*/shopper-stores/v1/organizations/v1/organizations/f_ecom_zzrf_001/store-search',
            (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json(mockStores))
            }
        )
    )

    // render our test component
    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    await user.click(await screen.findByText('Find a Store'))

    await waitFor(() => {
        expect(window.location.pathname).toBe('/uk/en-GB/store-locator')
    })
})

test('Allows customer to go to store locator page and then select a new store', async () => {
    global.server.use(
        rest.get(
            'https://www.domain.com/mobify/proxy/api/store/shopper-stores/v1/organizations/:organizationId/store-search',
            (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json(mockStores))
            }
        )
    )

    const {user} = renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    await user.click(await screen.findByText('Find a Store'))

    const countrySelect = await screen.findByDisplayValue('Select a country')
    await user.selectOptions(countrySelect, 'DE')

    await user.type(screen.getByPlaceholderText(/Enter postal code/i), '69117')

    const findButtonInForm = screen.getByRole('button', {name: 'Find'})
    await user.click(findButtonInForm)

    const storeToSelect = 'Heidelberg Tech Mart'
    await waitFor(() => {
        expect(screen.getByText(storeToSelect)).toBeInTheDocument()
    })

    const storeNameElement = await screen.findByText(storeToSelect)

    const storeAccordionItem = storeNameElement.closest('.chakra-accordion__item')
    if (!storeAccordionItem) {
        throw new Error(`Could not find parent .chakra-accordion__item for store: ${storeToSelect}`)
    }

    const storeRadio = within(storeAccordionItem).getByRole('radio')

    await user.click(storeRadio)
    expect(storeRadio).toBeChecked()
})

test('Show no stores are found if there are no stores', async () => {
    global.server.use(
        rest.get(
            '*/shopper-stores/v1/organizations/v1/organizations/f_ecom_zzrf_001/store-search',
            (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json(mockNoStores))
            }
        )
    )

    // render our test component
    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    await waitFor(() => {
        const descriptionFindAStore = screen.getByText(/Find a Store/i)
        const noLocationsInThisArea = screen.getByText(
            /Sorry, there are no locations in this area/i
        )
        expect(descriptionFindAStore).toBeInTheDocument()
        expect(noLocationsInThisArea).toBeInTheDocument()

        expect(window.location.pathname).toBe('/uk/en-GB/store-locator')
    })
})
