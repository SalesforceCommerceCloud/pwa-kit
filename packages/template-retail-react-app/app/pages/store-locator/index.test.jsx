/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import StoreLocatorPage from '@salesforce/retail-react-app/app/pages/store-locator/index'

jest.mock('@salesforce/retail-react-app/app/components/store-locator', () => ({
    StoreLocator: () => <div data-testid="mock-store-locator-content">Mock Content</div>
}))

describe('StoreLocatorPage', () => {
    it('renders the store locator page with content', () => {
        render(<StoreLocatorPage />)

        // Verify the page wrapper is rendered
        expect(screen.getByTestId('store-locator-page')).toBeTruthy()

        // Verify the mocked content is rendered
        expect(screen.getByTestId('mock-store-locator-content')).toBeTruthy()
    })

    it('returns correct template name', () => {
        expect(StoreLocatorPage.getTemplateName()).toBe('store-locator')
    })
})
