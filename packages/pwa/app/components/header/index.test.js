/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {fireEvent, waitFor, screen} from '@testing-library/react'
import Header from './index'
import {renderWithProviders} from '../../utils/test-utils'

jest.mock('@chakra-ui/react', () => {
    const originalModule = jest.requireActual('@chakra-ui/react')
    return {
        ...originalModule,
        useMediaQuery: jest.fn().mockReturnValue([true])
    }
})

jest.mock('../../commerce-api/hooks/useCustomer', () => {
    return () => ({
        isRegistered: true
    })
})

test('renders Header', () => {
    renderWithProviders(<Header />)
    const menu = document.querySelector('button[aria-label="Menu"]')
    const logo = document.querySelector('button[aria-label="Logo"]')
    const account = document.querySelector('svg[aria-label="My account"]')
    const cart = document.querySelector('button[aria-label="My cart"]')
    const wishlist = document.querySelector('button[aria-label="Wishlist"]')
    const searchInput = document.querySelector('input[type="search"]')
    expect(menu).toBeInTheDocument()
    expect(logo).toBeInTheDocument()
    expect(account).toBeInTheDocument()
    expect(cart).toBeInTheDocument()
    expect(wishlist).toBeInTheDocument()
    expect(searchInput).toBeInTheDocument()
})

test('renders Header with event handlers', () => {
    const onMenuClick = jest.fn()
    const onLogoClick = jest.fn()
    const onMyAccountClick = jest.fn()
    const onMyCartClick = jest.fn()
    renderWithProviders(
        <Header
            onMenuClick={onMenuClick}
            onLogoClick={onLogoClick}
            onMyAccountClick={onMyAccountClick}
            onMyCartClick={onMyCartClick}
        />
    )
    const menu = document.querySelector('button[aria-label="Menu"]')
    const logo = document.querySelector('button[aria-label="Logo"]')
    const account = document.querySelector('svg[aria-label="My account"]')
    const cart = document.querySelector('button[aria-label="My cart"]')

    fireEvent.click(menu)
    expect(onMenuClick).toHaveBeenCalledTimes(1)
    fireEvent.click(logo)
    expect(onLogoClick).toHaveBeenCalledTimes(1)
    fireEvent.click(account)
    expect(onMyAccountClick).toHaveBeenCalledTimes(1)
    fireEvent.click(cart)
    expect(onMyCartClick).toHaveBeenCalledTimes(1)
})

/**
 * The badge component on the cart that shows the number of items in the cart
 * should only be displayed when there is a valid cart loaded.
 */
const testBaskets = [null, undefined, {basketId: null}, {basketId: undefined}]

test.each(testBaskets)('does not render cart badge when basket not loaded', (initialBasket) => {
    renderWithProviders(<Header />, {wrapperProps: {initialBasket}})

    // Look for badge.
    const badge = document.querySelector('button[aria-label="My cart"] .chakra-badge')

    expect(badge).toBeNull()
})

test('renders cart badge when basket is loaded', () => {
    const initialBasket = {basketId: 'valid_id'}

    renderWithProviders(<Header />, {wrapperProps: {initialBasket}})

    // Look for badge.
    const badge = document.querySelector('button[aria-label="My cart"] .chakra-badge')

    expect(badge).toBeInTheDocument()
})

test('shows dropdown menu when an authenticated users hover on the account icon', async () => {
    renderWithProviders(<Header />)
    // Look for account icon
    const account = document.querySelector('svg[aria-label="My account"]')

    fireEvent.mouseOver(account)

    await waitFor(() => {
        // Look for account icon
        const accountTrigger = document.querySelector('svg[aria-label="My account trigger"]')
        expect(accountTrigger).toBeInTheDocument()
        expect(screen.getByText('My Account')).toBeInTheDocument()
    })
})
