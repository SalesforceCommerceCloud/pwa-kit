/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable react/prop-types */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {ChakraProvider} from '@chakra-ui/react'
import {BrowserRouter} from 'react-router-dom'
import AppMobileNavigation from './app-mobile-navigation'
import theme from '../../../theme'

// Mock DrawerMenu component
jest.mock('../../drawer-menu', () => ({
    DrawerMenu: function MockDrawerMenu(props) {
        // Convert functions to strings for JSON serialization
        const serializedProps = Object.keys(props).reduce((acc, key) => {
            acc[key] = typeof props[key] === 'function' ? 'function' : props[key]
            return acc
        }, {})

        return (
            <div data-testid="drawer-menu">
                <div data-testid="drawer-menu-props">{JSON.stringify(serializedProps)}</div>
            </div>
        )
    }
}))

// Mock responsive components
jest.mock('../../responsive', () => ({
    HideOnDesktop: function MockHideOnDesktop({children}) {
        return <div data-testid="hide-on-desktop">{children}</div>
    },
    HideOnMobile: function MockHideOnMobile({children}) {
        return <div data-testid="hide-on-mobile">{children}</div>
    }
}))

// Mock Box component
jest.mock('@chakra-ui/react', () => ({
    ...jest.requireActual('@chakra-ui/react'),
    Box: function MockBox({children}) {
        return <div data-testid="box">{children}</div>
    }
}))

// Mock list-menu components
jest.mock('../../list-menu', () => ({
    ListMenu: function MockListMenu({children}) {
        return <div data-testid="list-menu">{children}</div>
    },
    ListMenuContent: function MockListMenuContent({children}) {
        return <div data-testid="list-menu-content">{children}</div>
    }
}))

// Mock other dependencies
jest.mock('../../fade', () => {
    return function MockFade({children}) {
        return <div data-testid="fade">{children}</div>
    }
})

// Mock withCommerceSdkReact HOC
jest.mock('../../with-commerce-sdk-react', () => ({
    withCommerceSdkReact: jest.fn((component) => component)
}))

// Mock useCategory hook
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useCategory: jest.fn(() => ({
        data: null,
        isLoading: false,
        error: null
    }))
}))

// Mock useAppConfig hook
jest.mock('../hooks', () => ({
    useAppConfig: jest.fn(() => ({
        appConfig: {
            name: 'Test App',
            categoryNav: {
                defaultRootCategory: 0
            }
        }
    }))
}))

describe('AppMobileNavigation', () => {
    const renderWithProviders = (component) => {
        return render(
            <ChakraProvider value={theme}>
                <BrowserRouter>{component}</BrowserRouter>
            </ChakraProvider>
        )
    }

    const defaultProps = {
        categories: {
            0: {
                id: 'root',
                name: 'Root Category',
                categories: [
                    {id: '1', name: 'Category 1'},
                    {id: '2', name: 'Category 2'}
                ]
            },
            1: {id: 'another', name: 'Another Category'}
        },
        isDrawerMenuOpen: false,
        onDrawerMenuClose: jest.fn(),
        onLogoClick: jest.fn()
    }

    afterEach(() => {
        jest.clearAllMocks()
    })

    test('renders without crashing', () => {
        renderWithProviders(<AppMobileNavigation {...defaultProps} />)
        expect(screen.getByTestId('drawer-menu')).toBeInTheDocument()
    })

    test('passes correct categories to DrawerMenu', () => {
        renderWithProviders(<AppMobileNavigation {...defaultProps} />)

        const drawerMenuPropsElement = screen.getByTestId('drawer-menu-props')
        const drawerMenuProps = JSON.parse(drawerMenuPropsElement.textContent)

        // The component passes root={rootCategory}, not categories
        expect(drawerMenuProps.root).toEqual(defaultProps.categories[0])
        expect(drawerMenuProps.itemsKey).toBe('categories')
        expect(drawerMenuProps.itemsCountKey).toBe('onlineSubCategoriesCount')
    })

    test('passes isOpen state correctly', () => {
        const props = {
            ...defaultProps,
            isDrawerMenuOpen: true
        }

        renderWithProviders(<AppMobileNavigation {...props} />)

        const drawerMenuPropsElement = screen.getByTestId('drawer-menu-props')
        const drawerMenuProps = JSON.parse(drawerMenuPropsElement.textContent)

        expect(drawerMenuProps.isOpen).toBe(true)
    })

    test('passes onClose handler correctly', () => {
        renderWithProviders(<AppMobileNavigation {...defaultProps} />)

        const drawerMenuPropsElement = screen.getByTestId('drawer-menu-props')
        const drawerMenuProps = JSON.parse(drawerMenuPropsElement.textContent)

        expect(drawerMenuProps.onClose).toBe('function')
    })

    test('passes onLogoClick handler correctly', () => {
        renderWithProviders(<AppMobileNavigation {...defaultProps} />)

        const drawerMenuPropsElement = screen.getByTestId('drawer-menu-props')
        const drawerMenuProps = JSON.parse(drawerMenuPropsElement.textContent)

        expect(drawerMenuProps.onLogoClick).toBe('function')
    })

    test('handles empty categories gracefully', () => {
        const props = {
            ...defaultProps,
            categories: {}
        }

        renderWithProviders(<AppMobileNavigation {...props} />)

        expect(screen.getByTestId('drawer-menu')).toBeInTheDocument()
    })
})
