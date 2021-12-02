/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {MemoryRouter} from 'react-router-dom'
import {screen, waitFor, within} from '@testing-library/react'
import user from '@testing-library/user-event'
import {renderWithProviders} from '../../utils/test-utils'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import Account from './index'

jest.mock('../../commerce-api/utils', () => {
    const originalModule = jest.requireActual('../../commerce-api/utils')
    return {
        ...originalModule,
        isTokenValid: jest.fn().mockReturnValue(true)
    }
})

jest.mock('react-router', () => {
    const originalModule = jest.requireActual('react-router')
    return {
        ...originalModule,
        useRouteMatch: () => ({
            path: '/en-GB/account',
            url: '/en-GB/account'
        })
    }
})

jest.mock('../../commerce-api/hooks/useCustomer', () => jest.fn())
jest.mock('./profile', () =>
    jest.fn().mockReturnValue(<div data-testid="account-detail-page">account-detail-page</div>)
)
jest.mock('./orders', () => jest.fn().mockReturnValue(null))
jest.mock('./addresses', () => jest.fn().mockReturnValue(null))
jest.mock('./payments', () => jest.fn().mockReturnValue(null))

// Set up and clean up
beforeEach(() => {
    jest.resetModules()
})

test('Redirects to login page if the customer is not logged in', async () => {
    useCustomer.mockImplementation(() => ({
        login: jest.fn(),
        isRegistered: false,
        authType: 'guest'
    }))
    renderWithProviders(<Account />)
    await waitFor(() => expect(window.location.pathname).toEqual('/en-GB/login'))
})

test('Provides navigation for subpages', async () => {
    useCustomer.mockImplementation(() => ({
        login: jest.fn(),
        isRegistered: true,
        authType: 'registered'
    }))
    renderWithProviders(<Account />)
    expect(await screen.findByTestId('account-page')).toBeInTheDocument()

    const nav = within(screen.getByTestId('account-detail-nav'))
    user.click(nav.getByText('Addresses'))
    await waitFor(() => expect(window.location.pathname).toEqual('/en-GB/account/addresses'))
    user.click(nav.getByText('Order History'))
    await waitFor(() => expect(window.location.pathname).toEqual('/en-GB/account/orders'))
    user.click(nav.getByText('Payment Methods'))
    await waitFor(() => expect(window.location.pathname).toEqual('/en-GB/account/payments'))
})

test('Renders account detail page by default for logged-in customer', async () => {
    useCustomer.mockImplementation(() => ({
        login: jest.fn(),
        isRegistered: true,
        authType: 'registered'
    }))

    const MockedComponent = () => {
        return (
            <MemoryRouter initialEntries={['/en-GB/account']}>
                <Account />
            </MemoryRouter>
        )
    }

    renderWithProviders(<MockedComponent />)
    expect(await screen.findByTestId('account-page')).toBeInTheDocument()
    expect(await screen.findByTestId('account-detail-page')).toBeInTheDocument()
})

test('Allows customer to sign out', async () => {
    let authStatus = true

    useCustomer.mockImplementation(() => ({
        login: jest.fn(),
        isRegistered: authStatus,
        authType: 'registered',
        logout: () => {
            authStatus = false
        }
    }))

    renderWithProviders(<Account />)
    expect(await screen.findByTestId('account-page')).toBeInTheDocument()
    user.click(screen.getAllByText('Log out')[0])
    await waitFor(() => {
        expect(window.location.pathname).toEqual('/en-GB/login')
    })
})
