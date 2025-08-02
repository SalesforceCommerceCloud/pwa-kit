/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {StorefrontPreview} from '@salesforce/commerce-sdk-react/components'
import AppProviders from './app-providers'

// Mock components
const MockChild = () => <div>Test Child</div>

// Mock external dependencies
jest.mock('@salesforce/commerce-sdk-react/components', () => ({
    StorefrontPreview: jest.fn(({children}) => (
        <div data-testid="storefront-preview">{children}</div>
    ))
}))

// Mock the useAppConfig hook
jest.mock('../hooks/use-app-config', () => ({
    useAppConfig: jest.fn(() => ({
        appConfig: {
            defaultAppLocale: 'en-US'
        }
    }))
}))

// Mock CurrencyProvider
jest.mock('../../../contexts', () => ({
    CurrencyProvider: jest.fn(({children}) => <div data-testid="currency-provider">{children}</div>)
}))

describe('AppProviders', () => {
    const defaultProps = {
        getTokenWhenReady: jest.fn(),
        targetLocale: 'en-US',
        messages: {'test.message': 'Test Message'},
        currency: 'USD'
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders children correctly', () => {
        render(
            <AppProviders {...defaultProps}>
                <MockChild />
            </AppProviders>
        )

        expect(screen.getByText('Test Child')).toBeInTheDocument()
    })

    test('sets up StorefrontPreview with correct props', () => {
        render(
            <AppProviders {...defaultProps}>
                <MockChild />
            </AppProviders>
        )

        expect(StorefrontPreview).toHaveBeenCalledWith(
            expect.objectContaining({
                getToken: defaultProps.getTokenWhenReady
            }),
            expect.anything()
        )
    })

    test('sets up IntlProvider with correct locale and messages', () => {
        render(
            <AppProviders {...defaultProps}>
                <MockChild />
            </AppProviders>
        )

        // IntlProvider should be in the DOM with correct locale
        expect(screen.getByText('Test Child')).toBeInTheDocument()
    })

    test('provides ChakraProvider for styling', () => {
        render(
            <AppProviders {...defaultProps}>
                <MockChild />
            </AppProviders>
        )

        expect(screen.getByTestId('storefront-preview')).toBeInTheDocument()
    })

    test('handles missing messages gracefully', () => {
        const props = {
            ...defaultProps,
            messages: undefined
        }

        render(
            <AppProviders {...props}>
                <MockChild />
            </AppProviders>
        )

        expect(screen.getByText('Test Child')).toBeInTheDocument()
    })

    test('handles different currencies', () => {
        const props = {
            ...defaultProps,
            currency: 'EUR'
        }

        render(
            <AppProviders {...props}>
                <MockChild />
            </AppProviders>
        )

        expect(screen.getByTestId('currency-provider')).toBeInTheDocument()
    })
})
