/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'

import CheckoutFooter from '@salesforce/retail-react-app/app/pages/checkout/partials/checkout-footer'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

test('renders component', () => {
    renderWithProviders(<CheckoutFooter />)
    expect(screen.getByRole('link', {name: 'Shipping'})).toBeInTheDocument()
})
