/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {StoreLocator} from '@salesforce/retail-react-app/app/components/store-locator/main'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

jest.mock('./list', () => ({
    StoreLocatorList: () => <div data-testid="store-locator-list">Store List Mock</div>
}))

jest.mock('./form', () => ({
    StoreLocatorForm: () => <div data-testid="store-locator-form">Store Form Mock</div>
}))

jest.mock('./heading', () => ({
    StoreLocatorHeading: () => <div data-testid="store-locator-heading">Store Heading Mock</div>
}))

jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket')

describe('StoreLocator', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        useCurrentBasket.mockReturnValue({
            derivedData: {
                totalItems: 0
            }
        })
    })

    it('renders all child components in correct order', () => {
        renderWithProviders(<StoreLocator />)

        const content = document.body.innerHTML
        const headingIndex = content.indexOf('Store Heading Mock')
        const formIndex = content.indexOf('Store Form Mock')
        const listIndex = content.indexOf('Store List Mock')

        expect(headingIndex).toBeLessThan(formIndex)
        expect(formIndex).toBeLessThan(listIndex)
    })

    it('renders with basket items', () => {
        useCurrentBasket.mockReturnValue({
            derivedData: {
                totalItems: 2
            }
        })

        renderWithProviders(<StoreLocator />)

        expect(document.body.innerHTML).toContain('Store List Mock')
        expect(document.body.innerHTML).toContain('Store Form Mock')
        expect(document.body.innerHTML).toContain('Store Heading Mock')
    })
})
