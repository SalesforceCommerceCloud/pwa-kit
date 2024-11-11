/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render} from '@testing-library/react'
import '@testing-library/jest-dom'
import withCurrency from './with-currency'
import {CurrencyProvider} from '../../contexts'
import useMultiSite from '../../hooks/use-multi-site'

// Mock the `useMultiSite` hook
jest.mock('../../hooks/use-multi-site', () => ({
    __esModule: true,
    default: jest.fn()
}))

const mockUseMultiSite = useMultiSite as jest.MockedFunction<typeof useMultiSite>

// Define a simple test component
const TestComponent: React.FC = () => <div data-testid="test-component">Test Component</div>

// Wrap the TestComponent with withCurrency HOC
const WrappedComponent = withCurrency(TestComponent)

describe('withCurrency HOC', () => {
    beforeEach(() => {
        // Set up a default mock implementation for useMultiSite
        mockUseMultiSite.mockReturnValue({
            site: {l10n: {defaultCurrency: 'USD'}},
            locale: {preferredCurrency: 'EUR'},
            buildUrl: () => ''
        })
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should render the wrapped component', () => {
        const {getByTestId} = render(<WrappedComponent />)
        expect(getByTestId('test-component')).toBeInTheDocument()
    })

    it('should use locale.preferredCurrency if available', () => {
        const {getByTestId} = render(<WrappedComponent />)

        // Check if CurrencyProvider has been rendered with the preferred currency
        expect(mockUseMultiSite).toHaveBeenCalledTimes(1)
        expect(mockUseMultiSite).toHaveReturnedWith({
            site: {l10n: {defaultCurrency: 'USD'}},
            locale: {preferredCurrency: 'EUR'}
        })
    })

    it('should fallback to l10n.defaultCurrency if preferredCurrency is not available', () => {
        // Update the mock to have an empty preferredCurrency
        mockUseMultiSite.mockReturnValueOnce({
            site: {l10n: {defaultCurrency: 'USD'}},
            locale: {preferredCurrency: ''},
            buildUrl: () => ''
        })

        const {getByTestId} = render(<WrappedComponent />)

        // Ensure the wrapped component renders
        expect(getByTestId('test-component')).toBeInTheDocument()
        // Verify that the currency fallback to defaultCurrency (USD)
        expect(mockUseMultiSite).toHaveReturnedWith({
            site: {l10n: {defaultCurrency: 'USD'}},
            locale: {preferredCurrency: ''}
        })
    })
})
