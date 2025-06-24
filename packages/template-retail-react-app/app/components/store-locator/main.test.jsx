/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {StoreLocator} from '@salesforce/retail-react-app/app/components/store-locator/main'
import {rest} from 'msw'

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: jest.fn(() => ({
        derivedData: {totalItems: 0}
    }))
}))

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {useCurrentBasket} = require('@salesforce/retail-react-app/app/hooks/use-current-basket')

jest.mock('./form', () => ({
    StoreLocatorForm: () => <div data-testid="store-locator-form">Store Form Mock</div>
}))

jest.mock('./heading', () => ({
    StoreLocatorHeading: () => <div data-testid="store-locator-heading">Store Heading Mock</div>
}))

describe('StoreLocatorContent', () => {
    beforeEach(() => {
        useCurrentBasket.mockReturnValue({
            derivedData: {totalItems: 0}
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })
    it('renders all child components', () => {
        renderWithProviders(<StoreLocator />)
        expect(screen.queryByTestId('store-locator-heading')).not.toBeNull()
        expect(screen.queryByTestId('store-locator-form')).not.toBeNull()
        expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    })

    test('shows cart warning when cart has items', async () => {
        useCurrentBasket.mockReturnValue({
            derivedData: {totalItems: 2}
        })
        global.server.use(
            rest.get('*/shopper-stores/v1/organizations/*', (req, res, ctx) => {
                return res(
                    ctx.status(200),
                    ctx.json({
                        data: [
                            {
                                id: 'store1',
                                name: 'Test Store',
                                address: {
                                    address1: '123 Test St',
                                    city: 'Test City',
                                    stateCode: 'CA',
                                    postalCode: '94105'
                                }
                            }
                        ],
                        total: 1
                    })
                )
            })
        )

        renderWithProviders(<StoreLocator />)
        expect(
            await screen.findByText(
                'Sorry, you have items in your basket. Please remove them to continue.'
            )
        ).toBeInTheDocument()
    })
})
