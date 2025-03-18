/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'

import CheckoutHeader from '@salesforce/retail-react-app/app/pages/checkout/partials/checkout-header'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

test('renders component', () => {
    renderWithProviders(<CheckoutHeader />)
    expect(screen.getByTitle(/back to homepage/i)).toBeInTheDocument()
})
