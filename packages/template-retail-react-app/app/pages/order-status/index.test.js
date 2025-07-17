/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen} from '@testing-library/react'
import OrderStatusPage from '@salesforce/retail-react-app/app/pages/order-status/index.jsx'

describe('OrderStatusPage', () => {
    it('renders the order status page', () => {
        render(<OrderStatusPage />)
        expect(screen.getByTestId('order-status-page')).toBeTruthy()
        expect(screen.getByRole('heading', {name: /order status/i})).toBeInTheDocument()
    })
})
