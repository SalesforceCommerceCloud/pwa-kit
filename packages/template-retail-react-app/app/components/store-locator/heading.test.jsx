/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {StoreLocatorHeading} from '@salesforce/retail-react-app/app/components/store-locator/heading'

describe('StoreLocatorHeading', () => {
    test('renders heading with correct text', () => {
        render(<StoreLocatorHeading />)

        const heading = screen.getByText('Find a Store')
        expect(heading).toBeTruthy()
    })
})
