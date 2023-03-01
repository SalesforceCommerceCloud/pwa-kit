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
import Header from './index'
import {renderWithProviders, createPathWithDefaults} from '../../utils/test-utils'
import {rest} from 'msw'
import {Route, Switch} from 'react-router-dom'
import {createMemoryHistory} from 'history'
import {mockCustomerBaskets, mockedRegisteredCustomer} from '../../commerce-api/mock-data'
import {
    ShopperLoginHelpers,
    useCustomerType,
    useShopperLoginHelper
} from 'commerce-sdk-react-preview'

jest.mock('commerce-sdk-react-preview', () => {
    const originModule = jest.requireActual('commerce-sdk-react-preview')
    return {
        ...originModule,
        useCustomerId: jest.fn().mockReturnValue('customer_id'),
        useCustomerType: jest
            .fn()
            .mockReturnValue({isRegistered: false, isGuest: true, customerType: 'guest'})
    }
})
jest.mock('@chakra-ui/react', () => {
    const originalModule = jest.requireActual('@chakra-ui/react')
    return {
        ...originalModule,
        useMediaQuery: jest.fn().mockReturnValue([true])
    }
})
const MockedComponent = ({history}) => {
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)
    React.useEffect(() => {
        loginRegisteredUser.mutate({username: 'customer@test.com', password: 'password1'})
    }, [])
    const {isRegistered, customerType} = useCustomerType()
    const onAccountClick = () => {
        // Link to account page for registered customer, open auth modal otherwise
        if (isRegistered) {
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
                    <div>home page {customerType}</div>
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
    await act(async () => {
        renderWithProviders(<Header />)
    })
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
    await act(async () => {
        renderWithProviders(
            <Header
                onMenuClick={onMenuClick}
                onLogoClick={onLogoClick}
                onMyAccountClick={onMyAccountClick}
                onMyCartClick={onMyCartClick}
            />
        )
    })
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
        await act(async () => {
            renderWithProviders(<Header />)
        })

        await waitFor(() => {
            // Look for badge.
            const badge = document.querySelector('button[aria-label="My cart"] .chakra-badge')
            expect(badge).not.toBeInTheDocument()
        })
    }
)

test('renders cart badge when basket is loaded', async () => {
    await act(async () => {
        renderWithProviders(<Header />)
    })

    await waitFor(() => {
        // Look for badge.
        const badge = document.querySelector('button[aria-label="My cart"] .chakra-badge')
        expect(badge).toBeInTheDocument()
    })
})

test('route to account page when an authenticated users click on account icon', async () => {
    global.server.use(
        rest.post('*/customers/action/login', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        })
    )
    useCustomerType.mockReturnValue({isRegistered: true, customerType: 'registered'})
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

    fireEvent.keyDown(accountIcon, {key: 'Enter', code: 'Enter'})
    await waitFor(() => {
        expect(history.push).toHaveBeenCalledWith(createPathWithDefaults('/account'))
    })
})

//TODO: fix this test after wishlist is integrated with hook,
// currently it is still using the old login method while Header is using a new login
// test('route to wishlist page when an authenticated users click on wishlist icon', async () => {
//     const history = createMemoryHistory()
//     // mock push function
//     history.push = jest.fn()
//     useCustomerType.mockReturnValue({isRegistered: true, customerType: 'registered'})
//
//     await act(async () => {
//         renderWithProviders(<MockedComponent history={history} />)
//     })
//
//     await waitFor(() => {
//         // Look for account icon
//         const accountTrigger = document.querySelector('svg[aria-label="My account trigger"]')
//         expect(accountTrigger).toBeInTheDocument()
//     })
//     const wishlistIcon = screen.getByRole('button', {name: /wishlist/i})
//     console.log('wishlistIcon', wishlistIcon)
//     userEvent.click(wishlistIcon)
//     await waitFor(() => {
//         expect(history.push).toHaveBeenCalledWith(createPathWithDefaults('/account/wishlist'))
//     })
// })

test('shows dropdown menu when an authenticated users hover on the account icon', async () => {
    global.server.use(
        rest.post('*/customers/action/login', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockedRegisteredCustomer))
        })
    )
    const history = createMemoryHistory()
    // mock push function
    history.push = jest.fn()
    useCustomerType.mockReturnValue({isRegistered: true, customerType: 'registered'})
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
    userEvent.hover(accountIcon)

    await waitFor(() => {
        expect(screen.getByText(/account details/i)).toBeInTheDocument()
        expect(screen.getByText(/payment methods/i)).toBeInTheDocument()
        expect(screen.getByText(/addresses/i)).toBeInTheDocument()
        expect(screen.getByText(/wishlist/i)).toBeInTheDocument()
        expect(screen.getByText(/order history/i)).toBeInTheDocument()
    })
})
