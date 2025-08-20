/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '../../utils/test-utils'
import MarketingConsentCard from './index'

// Mock the hooks barrel to match component import path
jest.mock('../../hooks', () => ({
    useCurrentCustomer: jest.fn()
}))

import {useCurrentCustomer} from '../../hooks'

const component_title = 'Marketing Communication Preferences'

describe('MarketingConsentCard', () => {
    beforeEach(() => {
        // Reset mock before each test
        useCurrentCustomer.mockClear()
    })

    test('shows content normally when customer is loaded', () => {
        // Mock customer data as loaded
        useCurrentCustomer.mockReturnValue({
            isLoading: false,
            data: {
                customerId: '123'
            }
        })

        renderWithProviders(<MarketingConsentCard />, {})

        // When isLoading=false, the skeleton should still be present but in loaded state
        const skeletonContainer = screen.getByText(component_title).closest('.chakra-skeleton')
        expect(skeletonContainer).toBeInTheDocument()
        expect(skeletonContainer).toHaveClass('chakra-skeleton')

        // The heading should be accessible normally
        const heading = screen.getByRole('heading', {level: 2})
        expect(heading).toBeInTheDocument()
        expect(heading).toHaveTextContent(component_title)

        // Verify that the component rendered successfully when not loading
        expect(screen.getByText(component_title)).toBeInTheDocument()
    })
})
