/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {ChakraProvider} from '@chakra-ui/react'
import {BrowserRouter} from 'react-router-dom'
import AppHeader from './app-header'

// Mock Header component
jest.mock('../../header', () => {
    return function MockHeader(props) {
        return (
            <div data-testid="header">
                <div data-testid="header-props">{JSON.stringify(props)}</div>
            </div>
        )
    }
})

// Mock MobileNavigation component
jest.mock('../../mobile-navigation', () => {
    return function MockMobileNavigation(props) {
        return (
            <div data-testid="mobile-navigation">
                <div data-testid="mobile-nav-props">{JSON.stringify(props)}</div>
            </div>
        )
    }
})

describe('AppHeader', () => {
    const renderWithProviders = (component) => {
        return render(
            <ChakraProvider>
                <BrowserRouter>{component}</BrowserRouter>
            </ChakraProvider>
        )
    }

    const defaultProps = {
        isCheckout: false,
        styles: {container: {}},
        onMenuClick: jest.fn(),
        onLogoClick: jest.fn(),
        onMyCartClick: jest.fn(),
        onMyAccountClick: jest.fn(),
        onWishlistClick: jest.fn(),
        onStoreLocatorClick: jest.fn(),
        mobileNavigationProps: {
            categories: [],
            isDrawerMenuOpen: false,
            onDrawerMenuClose: jest.fn(),
            onLogoClick: jest.fn()
        }
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders header when not on checkout page', () => {
        renderWithProviders(<AppHeader {...defaultProps} />)

        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument()
    })

    it('does not render header on checkout page', () => {
        const props = {
            ...defaultProps,
            isCheckout: true
        }

        renderWithProviders(<AppHeader {...props} />)

        expect(screen.queryByTestId('header')).not.toBeInTheDocument()
        expect(screen.queryByTestId('mobile-navigation')).not.toBeInTheDocument()
    })

    it('passes correct props to Header component', () => {
        renderWithProviders(<AppHeader {...defaultProps} />)

        const headerPropsElement = screen.getByTestId('header-props')
        const headerProps = JSON.parse(headerPropsElement.textContent)

        expect(headerProps).toMatchObject({
            onMenuClick: expect.any(Object),
            onLogoClick: expect.any(Object),
            onMyCartClick: expect.any(Object),
            onMyAccountClick: expect.any(Object),
            onWishlistClick: expect.any(Object),
            onStoreLocatorClick: expect.any(Object)
        })
    })

    it('passes correct props to MobileNavigation component', () => {
        renderWithProviders(<AppHeader {...defaultProps} />)

        const mobileNavPropsElement = screen.getByTestId('mobile-nav-props')
        const mobileNavProps = JSON.parse(mobileNavPropsElement.textContent)

        expect(mobileNavProps).toMatchObject({
            categories: [],
            isDrawerMenuOpen: false
        })
    })

    it('handles missing styles gracefully', () => {
        const props = {
            ...defaultProps,
            styles: undefined
        }

        renderWithProviders(<AppHeader {...props} />)
        expect(screen.getByTestId('header')).toBeInTheDocument()
    })

    it('handles missing mobileNavigationProps gracefully', () => {
        const props = {
            ...defaultProps,
            mobileNavigationProps: undefined
        }

        renderWithProviders(<AppHeader {...props} />)
        expect(screen.getByTestId('header')).toBeInTheDocument()
    })
})
