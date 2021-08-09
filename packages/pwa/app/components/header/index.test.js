import React from 'react'
import {fireEvent} from '@testing-library/react'
import Header from './index'
import {renderWithProviders} from '../../utils/test-utils'

test('renders Header', () => {
    renderWithProviders(<Header />)
    const menu = document.querySelector('button[aria-label="Menu"]')
    const logo = document.querySelector('button[aria-label="Logo"]')
    const account = document.querySelector('button[aria-label="My account"]')
    const cart = document.querySelector('button[aria-label="My cart"]')
    const searchInput = document.querySelector('input[type="search"]')
    expect(menu).toBeInTheDocument()
    expect(logo).toBeInTheDocument()
    expect(account).toBeInTheDocument()
    expect(cart).toBeInTheDocument()
    expect(searchInput).toBeInTheDocument()
})

test('renders Header with event handlers', () => {
    const onMenuClick = jest.fn()
    const onLogoClick = jest.fn()
    const onMyAccountClick = jest.fn()
    const onMyCartClick = jest.fn()
    const onSearchChange = jest.fn()
    const onSearchSubmit = jest.fn()
    renderWithProviders(
        <Header
            onMenuClick={onMenuClick}
            onLogoClick={onLogoClick}
            onMyAccountClick={onMyAccountClick}
            onMyCartClick={onMyCartClick}
            onSearchChange={onSearchChange}
            onSearchSubmit={onSearchSubmit}
        />
    )
    const menu = document.querySelector('button[aria-label="Menu"]')
    const logo = document.querySelector('button[aria-label="Logo"]')
    const account = document.querySelector('button[aria-label="My account"]')
    const cart = document.querySelector('button[aria-label="My cart"]')
    const searchInput = document.querySelector('input[type="search"]')
    const form = document.querySelector('form')

    fireEvent.click(menu)
    expect(onMenuClick).toHaveBeenCalledTimes(1)
    fireEvent.click(logo)
    expect(onLogoClick).toHaveBeenCalledTimes(1)
    fireEvent.click(account)
    expect(onMyAccountClick).toHaveBeenCalledTimes(1)
    fireEvent.click(cart)
    expect(onMyCartClick).toHaveBeenCalledTimes(1)
    fireEvent.change(searchInput, {target: {value: '123'}})
    expect(searchInput.value).toBe('123')
    expect(onSearchChange).toHaveBeenCalledTimes(1)
    fireEvent.submit(form)
    expect(onSearchSubmit).toHaveBeenCalledTimes(1)
    expect(onSearchSubmit).toHaveBeenCalledWith(expect.anything(), '123')
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
