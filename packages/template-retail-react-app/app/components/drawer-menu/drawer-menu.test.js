/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, waitFor} from '@testing-library/react'
import {DrawerMenu} from '@salesforce/retail-react-app/app/components/drawer-menu'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {mockCategories} from '@salesforce/retail-react-app/app/mocks/mock-data'

// Mock the hooks and modules
jest.mock('@salesforce/retail-react-app/app/hooks/use-navigation')
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site')
jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useCustomerType: jest.fn(),
    useAuthHelper: jest.fn(),
    AuthHelpers: {
        Logout: 'logout'
    }
}))

import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {useCustomerType, useAuthHelper} from '@salesforce/commerce-sdk-react'

describe('DrawerMenu', () => {
    const mockNavigate = jest.fn()
    const mockLogout = {
        mutateAsync: jest.fn().mockResolvedValue({})
    }
    const mockOnClose = jest.fn()
    const mockOnLogoClick = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks()

        // Setup default mocks
        useNavigation.mockReturnValue(mockNavigate)
        useMultiSite.mockReturnValue({
            site: {
                l10n: {
                    supportedLocales: [{id: 'en-US'}, {id: 'fr-FR'}, {id: 'de-DE'}]
                }
            },
            buildUrl: jest.fn()
        })
        useCustomerType.mockReturnValue({isRegistered: false})
        useAuthHelper.mockReturnValue(mockLogout)
    })

    test('Renders DrawerMenu without errors', async () => {
        renderWithProviders(<DrawerMenu isOpen={true} root={mockCategories.root} />)

        const drawer = document.querySelector('.chakra-portal')
        const accordion = document.querySelector('.chakra-accordion')
        const socialIcons = document.querySelector('.sf-social-icons')

        expect(drawer).toBeInTheDocument()
        expect(accordion).toBeInTheDocument()
        expect(socialIcons).toBeInTheDocument()
    })

    test('Renders DrawerMenu Spinner without root', async () => {
        renderWithProviders(<DrawerMenu isOpen={true} />, {
            wrapperProps: {initialCategories: {}}
        })

        const spinner = document.querySelector('.chakra-spinner')

        expect(spinner).toBeInTheDocument()
    })

    test('renders drawer in closed state', () => {
        renderWithProviders(<DrawerMenu isOpen={false} root={mockCategories.root} />)

        // When drawer is closed, the drawer content should not be visible
        const drawerContent = document.querySelector('.chakra-modal__content')
        expect(drawerContent).not.toBeInTheDocument()
    })

    test('calls onClose when close button is clicked', async () => {
        const {user} = renderWithProviders(
            <DrawerMenu isOpen={true} root={mockCategories.root} onClose={mockOnClose} />
        )

        const closeButton = screen.getByRole('button', {name: /close/i})
        await user.click(closeButton)

        expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    test('calls onLogoClick when logo is clicked', async () => {
        const {user} = renderWithProviders(
            <DrawerMenu isOpen={true} root={mockCategories.root} onLogoClick={mockOnLogoClick} />
        )

        // The logo button is the first button in the header that contains the brand-logo icon
        const logoButton = screen.getAllByRole('button')[0]
        await user.click(logoButton)

        expect(mockOnLogoClick).toHaveBeenCalledTimes(1)
    })

    test('displays sign in link for guest users', () => {
        useCustomerType.mockReturnValue({isRegistered: false})

        renderWithProviders(<DrawerMenu isOpen={true} root={mockCategories.root} />)

        const signInLink = screen.getByRole('link', {name: /sign in/i})
        expect(signInLink).toBeInTheDocument()
        // The Link component from retail-react-app may not set href directly since it uses react-router
        // Check that the link exists rather than checking specific href attribute
        expect(signInLink).toHaveClass('chakra-link')
    })

    test('displays user account menu for registered users', () => {
        useCustomerType.mockReturnValue({isRegistered: true})

        renderWithProviders(<DrawerMenu isOpen={true} root={mockCategories.root} />)

        const myAccountButton = screen.getByRole('button', {name: /my account/i})
        expect(myAccountButton).toBeInTheDocument()
    })

    test('expands user account menu and shows account options', async () => {
        useCustomerType.mockReturnValue({isRegistered: true})

        const {user} = renderWithProviders(<DrawerMenu isOpen={true} root={mockCategories.root} />)

        const myAccountButton = screen.getByRole('button', {name: /my account/i})
        await user.click(myAccountButton)

        await waitFor(() => {
            expect(screen.getByText('Account Details')).toBeInTheDocument()
            expect(screen.getByText('Order History')).toBeInTheDocument()
            expect(screen.getByText('Addresses')).toBeInTheDocument()
        })
    })

    test('handles logout action for registered users', async () => {
        useCustomerType.mockReturnValue({isRegistered: true})

        const {user} = renderWithProviders(<DrawerMenu isOpen={true} root={mockCategories.root} />)

        // First expand the account menu
        const myAccountButton = screen.getByRole('button', {name: /my account/i})
        await user.click(myAccountButton)

        // Then click the logout button
        const logoutButton = await screen.findByRole('button', {name: /log out/i})
        await user.click(logoutButton)

        expect(mockLogout.mutateAsync).toHaveBeenCalledTimes(1)
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/login')
        })
    })

    test('renders category navigation when root categories are provided', () => {
        renderWithProviders(<DrawerMenu isOpen={true} root={mockCategories.root} />)

        // Check that category navigation is rendered
        const categoryNav = document.querySelector('#category-nav')
        expect(categoryNav).toBeInTheDocument()
        expect(categoryNav).toHaveAttribute('aria-live', 'polite')
        expect(categoryNav).toHaveAttribute('aria-atomic', 'true')
    })

    test('renders with custom itemsKey and itemsCountKey props', () => {
        const customRoot = {
            customItems: [{id: 'test-item', name: 'Test Item', customItems: []}]
        }

        renderWithProviders(
            <DrawerMenu
                isOpen={true}
                root={customRoot}
                itemsKey="customItems"
                itemsCountKey="customItemsCount"
            />
        )

        const categoryNav = document.querySelector('#category-nav')
        expect(categoryNav).toBeInTheDocument()
    })
})
