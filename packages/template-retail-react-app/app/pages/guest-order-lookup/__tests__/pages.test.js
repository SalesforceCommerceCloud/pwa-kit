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
import GuestOrderLookupRequest from '@salesforce/retail-react-app/app/pages/guest-order-lookup/request'
import GuestOrderLookupVerify from '@salesforce/retail-react-app/app/pages/guest-order-lookup/verify'
import GuestOrderLookupOrder from '@salesforce/retail-react-app/app/pages/guest-order-lookup/order'

describe('GuestOrderLookupRequest', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders heading for guest users', () => {
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        renderWithProviders(<GuestOrderLookupRequest />)
        expect(screen.getByText('Find Your Order')).toBeInTheDocument()
    })

    test('redirects to /account/orders when user is registered', () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false})
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-lookup']}>
                <GuestOrderLookupRequest />
            </MemoryRouter>
        )
        // When isRegistered, Redirect renders — the heading should NOT be present
        expect(screen.queryByText('Find Your Order')).not.toBeInTheDocument()
    })
})

describe('GuestOrderLookupVerify', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders heading for guest users', () => {
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        renderWithProviders(<GuestOrderLookupVerify />)
        expect(screen.getByText('Enter Access Code')).toBeInTheDocument()
    })

    test('redirects to /account/orders when user is registered', () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false})
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-lookup/verify']}>
                <GuestOrderLookupVerify />
            </MemoryRouter>
        )
        expect(screen.queryByText('Enter Access Code')).not.toBeInTheDocument()
    })
})

describe('GuestOrderLookupOrder', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders heading for guest users', () => {
        useCustomerType.mockReturnValue({isRegistered: false, isGuest: true})
        renderWithProviders(<GuestOrderLookupOrder />)
        expect(screen.getByText('Order Details')).toBeInTheDocument()
    })

    test('redirects to /account/orders when user is registered', () => {
        useCustomerType.mockReturnValue({isRegistered: true, isGuest: false})
        renderWithProviders(
            <MemoryRouter initialEntries={['/order-lookup/order']}>
                <GuestOrderLookupOrder />
            </MemoryRouter>
        )
        expect(screen.queryByText('Order Details')).not.toBeInTheDocument()
    })
})
