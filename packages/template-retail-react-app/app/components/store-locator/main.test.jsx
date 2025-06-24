/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {StoreLocator} from '@salesforce/retail-react-app/app/components/store-locator/main'

jest.mock('./list', () => ({
    StoreLocatorList: () => <div data-testid="store-locator-list">Store List Mock</div>
}))

jest.mock('./form', () => ({
    StoreLocatorForm: () => <div data-testid="store-locator-form">Store Form Mock</div>
}))

jest.mock('./heading', () => ({
    StoreLocatorHeading: () => <div data-testid="store-locator-heading">Store Heading Mock</div>
}))

describe('StoreLocatorContent', () => {
    it('renders all child components', () => {
        render(<StoreLocator />)

        // Verify that all child components are rendered
        expect(screen.queryByTestId('store-locator-heading')).not.toBeNull()
        expect(screen.queryByTestId('store-locator-form')).not.toBeNull()
        expect(screen.queryByTestId('store-locator-list')).not.toBeNull()
    })
})
