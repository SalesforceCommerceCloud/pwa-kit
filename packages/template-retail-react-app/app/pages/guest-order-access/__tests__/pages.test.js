/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {MemoryRouter} from 'react-router-dom'

jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useCustomerType: jest.fn(() => ({isRegistered: false, isGuest: true}))
}))

import {useCustomerType} from '@salesforce/commerce-sdk-react'
import GuestOrderAccessRequest from '@salesforce/retail-react-app/app/pages/guest-order-access/request'
import GuestOrderAccessVerify from '@salesforce/retail-react-app/app/pages/guest-order-access/verify'
import GuestOrderAccessOrder from '@salesforce/retail-react-app/app/pages/guest-order-access/order'

describe('GuestOrderAccessRequest', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders heading for guest users', () => {
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        renderWithProviders(<GuestOrderAccessRequest />)
        expect(screen.getByText('Find Your Order')).toBeInTheDocument()
    })

    test('redirects to /account/orders when user is registered', () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false})
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-access']}>
                <GuestOrderAccessRequest />
            </MemoryRouter>
        )
        // When isRegistered, Redirect renders — the heading should NOT be present
        expect(screen.queryByText('Find Your Order')).not.toBeInTheDocument()
    })
})

describe('GuestOrderAccessVerify', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders heading for guest users', () => {
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        renderWithProviders(<GuestOrderAccessVerify />)
        expect(screen.getByText('Enter Access Code')).toBeInTheDocument()
    })

    test('redirects to /account/orders when user is registered', () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false})
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-access/verify']}>
                <GuestOrderAccessVerify />
            </MemoryRouter>
        )
        expect(screen.queryByText('Enter Access Code')).not.toBeInTheDocument()
    })
})

describe('GuestOrderAccessOrder', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders heading for guest users', () => {
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        renderWithProviders(<GuestOrderAccessOrder />)
        expect(screen.getByText('Order Details')).toBeInTheDocument()
    })

    test('redirects to /account/orders when user is registered', () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false})
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-access/order']}>
                <GuestOrderAccessOrder />
            </MemoryRouter>
        )
        expect(screen.queryByText('Order Details')).not.toBeInTheDocument()
    })
})
