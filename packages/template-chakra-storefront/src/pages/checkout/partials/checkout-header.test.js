/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'

import CheckoutHeader from './checkout-header'
import {renderWithProviders} from '../../../utils/test-utils'

// Mock getConfig to return our mockConfig
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    const actualConfig = jest.requireActual('../../../../mock-config')
    return {
        getConfig: jest.fn().mockReturnValue(actualConfig)
    }
})

test('renders component', () => {
    renderWithProviders(<CheckoutHeader />)
    expect(screen.getByTitle(/back to homepage/i)).toBeInTheDocument()
})
