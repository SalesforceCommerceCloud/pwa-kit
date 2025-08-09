/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {createMemoryHistory} from 'history'
import {screen, waitFor, act} from '@testing-library/react'
import Header from '../../components/header/index'
import {renderWithProviders, createPathWithDefaults} from '../../utils/test-utils'
import {rest} from 'msw'
import {mockCustomerBaskets} from '../../../mocks/mock-data'

jest.mock('@chakra-ui/react', () => {
    const originalModule = jest.requireActual('@chakra-ui/react')
    return {
        ...originalModule,
        useMediaQuery: jest.fn().mockReturnValue([true])
    }
})

jest.mock('@salesforce/pwa-kit-extension-sdk/react', () => ({
    ...jest.requireActual('@salesforce/pwa-kit-extension-sdk/react'),
    useApplicationExtensionsStore: jest.fn().mockReturnValue({
        isModalOpen: false,
        closeModal: jest.fn()
    })
}))

const MockedComponent = ({history}) => {
    const onAccountClick = () => {
        history.push(createPathWithDefaults('/account'))
    }
    //@sfdc-extension-block-start SFDC_EXT_WISHLIST
    const onWishlistClick = () => {
        history.push(createPathWithDefaults('/account/wishlist'))
    }
    //@sfdc-extension-block-end SFDC_EXT_WISHLIST
    return (
        <div>
            <Header 
                onMyAccountClick={onAccountClick} 
                //@sfdc-extension-line SFDC_EXT_WISHLIST
                onWishlistClick={onWishlistClick} 
            />
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
    jest.restoreAllMocks()
    localStorage.clear()
})

test('renders Header', async () => {
    renderWithProviders(<Header />)

    await waitFor(() => {
        const menu = screen.getByLabelText('Menu')
        const logo = screen.getByLabelText('Logo')
        // header is rendering registered user
        const account = screen.getByLabelText(/Open account menu/i)
        const cart = screen.getByLabelText('My cart, number of items: 2')
        const searchInput = document.querySelector('input[type="search"]')
        expect(menu).toBeInTheDocument()
        expect(logo).toBeInTheDocument()
        expect(account).toBeInTheDocument()
        expect(cart).toBeInTheDocument()
        //@sfdc-extension-line SFDC_EXT_WISHLIST
        // expect(wishlist).toBeInTheDocument()
        expect(searchInput).toBeInTheDocument()
    })
})

test('renders Header with event handlers', async () => {
    const onMenuClick = jest.fn()
    const onLogoClick = jest.fn()
    const onMyAccountClick = jest.fn()
    const onMyCartClick = jest.fn()
    const {user} = renderWithProviders(
        <Header
            onMenuClick={onMenuClick}
            onLogoClick={onLogoClick}
            onMyAccountClick={onMyAccountClick}
            onMyCartClick={onMyCartClick}
        />
    )
    // wait til the component is properly rendered before performing any action
    await waitFor(() => {
        expect(screen.getByLabelText('Menu')).toBeInTheDocument()
        expect(screen.getByLabelText('Logo')).toBeInTheDocument()
        expect(screen.getByLabelText(/Open account menu/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/My cart, number of items: 2/i)).toBeInTheDocument()
    })
    const menu = screen.getByLabelText('Menu')
    const logo = screen.getByLabelText('Logo')
    const account = screen.getByLabelText(/My Account/i)
    const cart = screen.getByLabelText(/My cart, number of items: 2/)
    await act(async () => {
        await user.click(menu)
    })
    expect(onMenuClick).toHaveBeenCalledTimes(1)

    await act(async () => {
        await user.click(logo)
    })
    expect(onLogoClick).toHaveBeenCalledTimes(1)

    await act(async () => {
        await user.click(cart)
    })
    expect(onMyCartClick).toHaveBeenCalledTimes(1)

    await act(async () => {
        await user.click(account)
    })
    expect(onMyAccountClick).toHaveBeenCalledTimes(1)
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
            const cart = screen.getByLabelText('My cart, number of items: 0')
            const badge = document.querySelector(
                'button[aria-label="My cart, number of items: 0"] .chakra-badge'
            )

            // Cart icon should exist but with no badge
            expect(cart).toBeInTheDocument()
            expect(badge).not.toBeInTheDocument()
        })
    }
)

test('renders cart badge when basket is loaded', async () => {
    renderWithProviders(<Header />)

    await waitFor(() => {
        // Look for badge.
        const badge = screen.getByLabelText('My cart, number of items: 2')
        expect(badge).toBeInTheDocument()
    })
})

test('route to account page when an authenticated users click on account icon', async () => {
    const history = createMemoryHistory()
    history.push = jest.fn()
    const {user} = renderWithProviders(<MockedComponent history={history} />)

    await waitFor(() => {
        // Look for account icon
        const accountTrigger = screen.getByLabelText('Open account menu')
        expect(accountTrigger).toBeInTheDocument()
    })
    const accountButton = screen.getByLabelText(/My account/i)

    await act(async () => {
        await user.click(accountButton)
    })
    await waitFor(() => {
        expect(history.push).toHaveBeenCalledWith(createPathWithDefaults('/account'))
    })
})

//@sfdc-extension-block-start SFDC_EXT_WISHLIST
test('route to wishlist page when an authenticated users click on wishlist icon', async () => {
    const history = createMemoryHistory()
    // mock push function
    history.push = jest.fn()

    const {user} = renderWithProviders(<MockedComponent history={history} />)

    await waitFor(() => {
        // Look for account icon
        const accountTrigger = screen.getByLabelText('Open account menu')
        expect(accountTrigger).toBeInTheDocument()
    })
    const wishlistIcon = screen.getByRole('button', {name: /wishlist/i})
    await act(async () => {
        await user.click(wishlistIcon)
    })
    await waitFor(() => {
        expect(history.push).toHaveBeenCalledWith(createPathWithDefaults('/account/wishlist'))
    })
})
//@sfdc-extension-block-end SFDC_EXT_WISHLIST