/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import userEvent from '@testing-library/user-event'
import {fireEvent, screen, waitFor, act} from '@testing-library/react'
import Header from '@salesforce/retail-react-app/app/components/header/index'
import {
    renderWithProviders,
    createPathWithDefaults
} from '@salesforce/retail-react-app/app/utils/test-utils'
import {rest} from 'msw'
import {createMemoryHistory} from 'history'
import {
    mockCustomerBaskets,
    mockedRegisteredCustomer
} from '@salesforce/retail-react-app/app/mocks/mock-data'

jest.mock('@salesforce/retail-react-app/app/components/shared/ui', () => {
    const originalModule = jest.requireActual(
        '@salesforce/retail-react-app/app/components/shared/ui'
    )
    return {
        ...originalModule,
        useMediaQuery: jest.fn().mockReturnValue([true])
    }
})
const MockedComponent = ({history}) => {
    const onAccountClick = () => {
        history.push(createPathWithDefaults('/account'))
    }
    const onWishlistClick = () => {
        history.push(createPathWithDefaults('/account/wishlist'))
    }
    return (
        <div>
            <Header onMyAccountClick={onAccountClick} onWishlistClick={onWishlistClick} />
        </div>
    )
}
MockedComponent.propTypes = {
    history: PropTypes.object
}

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
    global.server.use(
        rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockCustomerBaskets))
        })
    )
})
afterEach(() => {
    localStorage.clear()
})
test('renders Header', async () => {
    renderWithProviders(<Header />)

    await waitFor(() => {
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
})

test('renders Header with event handlers', async () => {
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
    await waitFor(() => {
        const menu = document.querySelector('button[aria-label="Menu"]')
        const logo = document.querySelector('button[aria-label="Logo"]')
        const account = document.querySelector('svg[aria-label="My account"]')
        const cart = document.querySelector('button[aria-label="My cart"]')
        expect(menu).toBeInTheDocument()
        fireEvent.click(menu)
        expect(onMenuClick).toHaveBeenCalledTimes(1)
        fireEvent.click(logo)
        expect(onLogoClick).toHaveBeenCalledTimes(1)
        fireEvent.click(account)
        expect(onMyAccountClick).toHaveBeenCalledTimes(1)
        fireEvent.click(cart)
        expect(onMyCartClick).toHaveBeenCalledTimes(1)
    })
})

/**
 * The badge component on the cart that shows the number of items in the cart
 * should only be displayed when there is a valid cart loaded.
 */
const testBaskets = [null, undefined, {total: 0}]

test.each(testBaskets)(
    `does not render cart badge when basket value is not defined`,
    async (initialBasket) => {
        global.server.use(
            rest.get('*/customers/:customerId/baskets', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json(initialBasket))
            })
        )
        renderWithProviders(<Header />)

        await waitFor(() => {
            // Look for badge.
            const badge = document.querySelector('button[aria-label="My cart"] .chakra-badge')
            expect(badge).not.toBeInTheDocument()
        })
    }
)

test('renders cart badge when basket is loaded', async () => {
    renderWithProviders(<Header />)

    await waitFor(() => {
        // Look for badge.
        const badge = document.querySelector('button[aria-label="My cart"] .chakra-badge')
        expect(badge).toBeInTheDocument()
    })
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
    const user = userEvent.setup()
    const history = createMemoryHistory()
    // mock push function
    history.push = jest.fn()

    renderWithProviders(<MockedComponent history={history} />)

    await waitFor(() => {
        // Look for account icon
        const accountTrigger = document.querySelector('svg[aria-label="My account trigger"]')
        expect(accountTrigger).toBeInTheDocument()
    })
    const wishlistIcon = screen.getByRole('button', {name: /wishlist/i})
    await user.click(wishlistIcon)
    await waitFor(() => {
        expect(history.push).toHaveBeenCalledWith(createPathWithDefaults('/account/wishlist'))
    })
})

test('shows dropdown menu when an authenticated users hover on the account icon', async () => {
    const user = userEvent.setup()
    global.server.use(
        rest.post('*/customers/action/login', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        })
    )
    const history = createMemoryHistory()
    // mock push function
    history.push = jest.fn()
    await act(async () => {
        renderWithProviders(<MockedComponent history={history} />)
    })

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
    await user.hover(accountIcon)

    await waitFor(() => {
        expect(screen.getByText(/account details/i)).toBeInTheDocument()
        expect(screen.getByText(/addresses/i)).toBeInTheDocument()
        expect(screen.getByText(/wishlist/i)).toBeInTheDocument()
        expect(screen.getByText(/order history/i)).toBeInTheDocument()
    })
})
