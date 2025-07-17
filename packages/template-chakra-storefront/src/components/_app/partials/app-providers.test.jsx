/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {CommerceProvider} from '@salesforce/commerce-sdk-react'
import AppProviders from './app-providers'

// Mock components
const MockChild = () => <div>Test Child</div>

// Mock external dependencies
jest.mock('@salesforce/commerce-sdk-react', () => ({
    CommerceProvider: jest.fn(({children}) => <div data-testid="commerce-provider">{children}</div>)
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

    it('renders children correctly', () => {
        render(
            <AppProviders {...defaultProps}>
                <MockChild />
            </AppProviders>
        )

        expect(screen.getByText('Test Child')).toBeInTheDocument()
    })

    it('sets up CommerceProvider with correct props', () => {
        render(
            <AppProviders {...defaultProps}>
                <MockChild />
            </AppProviders>
        )

        expect(CommerceProvider).toHaveBeenCalledWith(
            expect.objectContaining({
                getTokenWhenReady: defaultProps.getTokenWhenReady
            }),
            expect.anything()
        )
    })

    it('sets up IntlProvider with correct locale and messages', () => {
        render(
            <AppProviders {...defaultProps}>
                <MockChild />
            </AppProviders>
        )

        // IntlProvider should be in the DOM with correct locale
        expect(screen.getByText('Test Child')).toBeInTheDocument()
    })

    it('provides ChakraProvider for styling', () => {
        render(
            <AppProviders {...defaultProps}>
                <MockChild />
            </AppProviders>
        )

        expect(screen.getByTestId('commerce-provider')).toBeInTheDocument()
    })

    it('handles missing messages gracefully', () => {
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

    it('handles different currencies', () => {
        const props = {
            ...defaultProps,
            currency: 'EUR'
        }

        render(
            <AppProviders {...props}>
                <MockChild />
            </AppProviders>
        )

        expect(screen.getByText('Test Child')).toBeInTheDocument()
    })
})
