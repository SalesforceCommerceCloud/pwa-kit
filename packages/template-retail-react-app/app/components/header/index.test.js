/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import PropTypes from 'prop-types'

import {fireEvent, screen, waitFor} from '@testing-library/react'
import Header from './index'
import {renderWithProviders, createPathWithDefaults} from '../../utils/test-utils'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import {rest} from 'msw'
import {mockedCustomerProductLists} from '../../commerce-api/mock-data'
import {Route, Switch} from 'react-router-dom'
import {createMemoryHistory} from 'history'

jest.mock('@chakra-ui/react', () => {
    const originalModule = jest.requireActual('@chakra-ui/react')
    return {
        ...originalModule,
        useMediaQuery: jest.fn().mockReturnValue([true])
    }
})

const MockedComponent = ({history}) => {
    const customer = useCustomer()
    useEffect(() => {
        if (!customer.isRegistered) {
            customer.login('customer@test.com', 'password1')
        }
    }, [])
    const onAccountClick = () => {
        // Link to account page for registered customer, open auth modal otherwise
        if (customer.isRegistered) {
            history.push(createPathWithDefaults('/account'))
        }
    }
    const onWishlistClick = () => {
        history.push(createPathWithDefaults('/account/wishlist'))
    }

    return (
        <Switch>
            <Route path={'/'}>
                <div>
                    <Header onMyAccountClick={onAccountClick} onWishlistClick={onWishlistClick} />
                    <div>home page</div>
                </div>
            </Route>
        </Switch>
    )
}
MockedComponent.propTypes = {
    history: PropTypes.object
}

// Set up and clean up
beforeEach(() => {
    jest.resetModules()

    // Since we're testing some navigation logic, we are using a simple Router
    // around our component. We need to initialize the default route/path here.
    window.history.pushState({}, 'Account', createPathWithDefaults('/account'))
})
afterEach(() => {
    localStorage.clear()
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

test('route to account page when an authenticated users click on account icon', async () => {
    const history = createMemoryHistory()
    // mock push function
    history.push = jest.fn()
    renderWithProviders(<MockedComponent history={history} />)

    await waitFor(() => {
        // Look for account icon
        const accountTrigger = document.querySelector('svg[aria-label="My account trigger"]')
        expect(accountTrigger).toBeInTheDocument()
    })
    const accountIcon = document.querySelector('svg[aria-label="My account"]')
    fireEvent.click(accountIcon)
    await waitFor(() => {
        expect(history.push).toHaveBeenCalledWith(createPathWithDefaults('/account'))
    })

    fireEvent.keyDown(accountIcon, {key: 'Enter', code: 'Enter'})
    await waitFor(() => {
        expect(history.push).toHaveBeenCalledWith(createPathWithDefaults('/account'))
    })
})

test('route to wishlist page when an authenticated users click on wishlist icon', async () => {
    const history = createMemoryHistory()
    // mock push function
    history.push = jest.fn()
    renderWithProviders(<MockedComponent history={history} />)

    await waitFor(() => {
        // Look for account icon
        const accountTrigger = document.querySelector('svg[aria-label="My account trigger"]')
        expect(accountTrigger).toBeInTheDocument()
    })
    const wishlistIcon = document.querySelector('button[aria-label="Wishlist"]')
    fireEvent.click(wishlistIcon)
    await waitFor(() => {
        expect(history.push).toHaveBeenCalledWith(createPathWithDefaults('/account/wishlist'))
    })
})

test('shows dropdown menu when an authenticated users hover on the account icon', async () => {
    global.server.use(
        // mock fetch product lists
        rest.get('*/customers/:customerId/product-lists', (req, res, ctx) => {
            return res(ctx.json(mockedCustomerProductLists))
        })
    )
    renderWithProviders(<MockedComponent />)
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
