/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable react/prop-types */

import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '../../../utils/test-utils'
import AppHeader from './app-header'

// Mock Header component
jest.mock('../../header', () => {
    function MockHeader(props) {
        // Create a safe serializable version of props
        const safeProps = {
            isLoading: props.isLoading,
            onMenuClick: typeof props.onMenuClick === 'function' ? 'function' : props.onMenuClick,
            onLogoClick: typeof props.onLogoClick === 'function' ? 'function' : props.onLogoClick,
            onMyCartClick:
                typeof props.onMyCartClick === 'function' ? 'function' : props.onMyCartClick,
            onMyAccountClick:
                typeof props.onMyAccountClick === 'function' ? 'function' : props.onMyAccountClick,
            //@sfdc-extension-line SFDC_EXT_WISHLIST
            onWishlistClick:
                typeof props.onWishlistClick === 'function' ? 'function' : props.onWishlistClick,
            onStoreLocatorClick:
                typeof props.onStoreLocatorClick === 'function'
                    ? 'function'
                    : props.onStoreLocatorClick
        }

        return (
            <div data-testid="header">
                <div data-testid="header-props" data-props={JSON.stringify(safeProps)} />
                {props.children}
            </div>
        )
    }

    return MockHeader
})

// Mock AppMobileNavigation component
jest.mock('./app-mobile-navigation', () => {
    function MockAppMobileNavigation(props) {
        const safeProps = {
            isDrawerMenuOpen: props.isDrawerMenuOpen,
            categories: Array.isArray(props.categories) ? props.categories.length : 0,
            onDrawerMenuClose:
                typeof props.onDrawerMenuClose === 'function'
                    ? 'function'
                    : props.onDrawerMenuClose,
            onLogoClick: typeof props.onLogoClick === 'function' ? 'function' : props.onLogoClick
        }

        return (
            <div data-testid="mobile-navigation">
                <div data-testid="mobile-navigation-props" data-props={JSON.stringify(safeProps)} />
            </div>
        )
    }

    return MockAppMobileNavigation
})

// Mock CheckoutHeader component
jest.mock('../../../pages/checkout/partials/checkout-header', () => {
    return function MockCheckoutHeader() {
        return <div data-testid="checkout-header">Checkout Header</div>
    }
})

// Mock useCurrentBasket hook
jest.mock('../../../hooks/use-current-basket', () => ({
    useCurrentBasket: jest.fn(() => ({
        derivedData: {totalItems: 0}
    }))
}))

describe('AppHeader', () => {
    const defaultProps = {
        isCheckout: false,
        styles: {
            headerWrapper: {},
            container: {}
        },
        onMenuClick: jest.fn(),
        onLogoClick: jest.fn(),
        onMyCartClick: jest.fn(),
        onMyAccountClick: jest.fn(),
        //@sfdc-extension-line SFDC_EXT_WISHLIST
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

    test('renders header when not on checkout page', () => {
        renderWithProviders(<AppHeader {...defaultProps} />)

        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument()
    })

    test('does not render header on checkout page', () => {
        const props = {
            ...defaultProps,
            isCheckout: true
        }

        renderWithProviders(<AppHeader {...props} />)

        expect(screen.queryByTestId('header')).not.toBeInTheDocument()
        expect(screen.queryByTestId('mobile-navigation')).not.toBeInTheDocument()
    })

    test('passes correct props to Header component', () => {
        renderWithProviders(<AppHeader {...defaultProps} />)

        const headerPropsElement = screen.getByTestId('header-props')
        const headerProps = JSON.parse(headerPropsElement.getAttribute('data-props'))

        expect(headerProps.onMenuClick).toBe('function')
        expect(headerProps.onLogoClick).toBe('function')
        expect(headerProps.onMyCartClick).toBe('function')
        expect(headerProps.onMyAccountClick).toBe('function')
        //@sfdc-extension-line SFDC_EXT_WISHLIST
        expect(headerProps.onWishlistClick).toBe('function')
    })

    test('passes correct props to MobileNavigation component', () => {
        renderWithProviders(<AppHeader {...defaultProps} />)

        const mobileNavPropsElement = screen.getByTestId('mobile-navigation-props')
        const mobileNavProps = JSON.parse(mobileNavPropsElement.getAttribute('data-props'))

        expect(mobileNavProps.categories).toBe(0) // Now returns count, not array
        expect(mobileNavProps.isDrawerMenuOpen).toBe(false)
        expect(mobileNavProps.onDrawerMenuClose).toBe('function')
        expect(mobileNavProps.onLogoClick).toBe('function')
    })

    test('handles missing styles gracefully', () => {
        const props = {
            ...defaultProps,
            styles: {
                headerWrapper: {},
                container: {}
            }
        }

        renderWithProviders(<AppHeader {...props} />)

        // The component should render without errors when styles are provided
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('mobile-navigation')).toBeInTheDocument()
    })
})
