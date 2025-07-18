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
    HideOnDesktop: ({children}) => <div data-testid="hide-on-desktop">{children}</div>,
    HideOnMobile: ({children}) => <div data-testid="hide-on-mobile">{children}</div>
}))

// Mock list-menu components
jest.mock('../../list-menu', () => ({
    ListMenu: ({children}) => <div data-testid="list-menu">{children}</div>,
    ListMenuContent: ({children}) => <div data-testid="list-menu-content">{children}</div>
}))

// Mock other dependencies
jest.mock('../../fade', () => {
    return function MockFade({children}) {
        return <div data-testid="fade">{children}</div>
    }
})

jest.mock('../../with-commerce-sdk-react', () => ({
    withCommerceSdkReact: (Component) => Component
}))

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

jest.mock('@salesforce/commerce-sdk-react', () => ({
    useCategory: jest.fn(() => ({
        isLoading: false,
        data: null
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

    it('renders without crashing', () => {
        renderWithProviders(<AppMobileNavigation {...defaultProps} />)
        expect(screen.getByTestId('drawer-menu')).toBeInTheDocument()
    })

    it('passes correct categories to DrawerMenu', () => {
        renderWithProviders(<AppMobileNavigation {...defaultProps} />)

        const drawerMenuPropsElement = screen.getByTestId('drawer-menu-props')
        const drawerMenuProps = JSON.parse(drawerMenuPropsElement.textContent)

        // The component passes root={rootCategory}, not categories
        expect(drawerMenuProps.root).toEqual(defaultProps.categories[0])
        expect(drawerMenuProps.itemsKey).toBe('categories')
        expect(drawerMenuProps.itemsCountKey).toBe('onlineSubCategoriesCount')
    })

    it('passes isOpen state correctly', () => {
        const props = {
            ...defaultProps,
            isDrawerMenuOpen: true
        }

        renderWithProviders(<AppMobileNavigation {...props} />)

        const drawerMenuPropsElement = screen.getByTestId('drawer-menu-props')
        const drawerMenuProps = JSON.parse(drawerMenuPropsElement.textContent)

        expect(drawerMenuProps.isOpen).toBe(true)
    })

    it('passes onClose handler correctly', () => {
        renderWithProviders(<AppMobileNavigation {...defaultProps} />)

        const drawerMenuPropsElement = screen.getByTestId('drawer-menu-props')
        const drawerMenuProps = JSON.parse(drawerMenuPropsElement.textContent)

        expect(drawerMenuProps.onClose).toBe('function')
    })

    it('passes onLogoClick handler correctly', () => {
        renderWithProviders(<AppMobileNavigation {...defaultProps} />)

        const drawerMenuPropsElement = screen.getByTestId('drawer-menu-props')
        const drawerMenuProps = JSON.parse(drawerMenuPropsElement.textContent)

        expect(drawerMenuProps.onLogoClick).toBe('function')
    })

    it('handles empty categories gracefully', () => {
        const props = {
            ...defaultProps,
            categories: {}
        }

        renderWithProviders(<AppMobileNavigation {...props} />)

        const drawerMenuPropsElement = screen.getByTestId('drawer-menu-props')
        const drawerMenuProps = JSON.parse(drawerMenuPropsElement.textContent)

        // When categories is empty, root should be undefined
        expect(drawerMenuProps.root).toBeUndefined()
    })
})
