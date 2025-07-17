/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {ChakraProvider} from '@chakra-ui/react'
import {BrowserRouter} from 'react-router-dom'
import AppFooter from './app-footer'

// Mock Footer component
jest.mock('../../footer', () => {
    return function MockFooter() {
        return <div data-testid="footer">Footer Content</div>
    }
})

describe('AppFooter', () => {
    const renderWithProviders = (component) => {
        return render(
            <ChakraProvider>
                <BrowserRouter>{component}</BrowserRouter>
            </ChakraProvider>
        )
    }

    it('renders footer when not on checkout page', () => {
        renderWithProviders(<AppFooter isCheckout={false} />)

        expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('does not render footer on checkout page', () => {
        renderWithProviders(<AppFooter isCheckout={true} />)

        expect(screen.queryByTestId('footer')).not.toBeInTheDocument()
    })

    it('renders footer by default when isCheckout prop is not provided', () => {
        renderWithProviders(<AppFooter />)

        expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('handles undefined isCheckout prop gracefully', () => {
        renderWithProviders(<AppFooter isCheckout={undefined} />)

        expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('handles null isCheckout prop gracefully', () => {
        renderWithProviders(<AppFooter isCheckout={null} />)

        expect(screen.getByTestId('footer')).toBeInTheDocument()
    })
})
