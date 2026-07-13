/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, waitFor} from '@testing-library/react'
import AdyenCheckoutRedirectContainer from '@salesforce/retail-react-app/app/pages/checkout/redirect/index'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useAccessToken, useCustomerId} from '@salesforce/commerce-sdk-react'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {AdyenCheckoutProvider, AdyenCheckout} from '@adyen/adyen-salesforce-pwa'

// Mock Adyen components
jest.mock('@adyen/adyen-salesforce-pwa', () => ({
    AdyenCheckout: jest.fn(() => <div data-testid="adyen-checkout" />),
    AdyenCheckoutProvider: jest.fn(({children}) => (
        <div data-testid="adyen-provider">{children}</div>
    ))
}))

// Mock hooks
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-basket', () => ({
    useCurrentBasket: jest.fn()
}))
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useAccessToken: jest.fn(),
    useCustomerId: jest.fn()
}))
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => jest.fn())
jest.mock('@salesforce/retail-react-app/app/hooks/use-navigation', () => jest.fn())

describe('AdyenCheckoutRedirectContainer', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        useCurrentBasket.mockReturnValue({data: {id: 'basket123'}})
        useCustomerId.mockReturnValue('customer123')
        useAccessToken.mockReturnValue({
            getTokenWhenReady: jest.fn().mockResolvedValue('token123')
        })
        useMultiSite.mockReturnValue({locale: 'en-US', site: 'site123'})
        useNavigation.mockReturnValue(jest.fn())
    })

    it('renders null if authToken is not ready', () => {
        // Simulate no token yet
        useAccessToken.mockReturnValue({getTokenWhenReady: jest.fn(() => new Promise(() => {}))})
        const {container} = render(<AdyenCheckoutRedirectContainer />)
        expect(container.firstChild).toBeNull()
    })

    it('renders null if basket is not ready', async () => {
        useCurrentBasket.mockReturnValue({data: undefined})
        const {container} = render(<AdyenCheckoutRedirectContainer />)
        await waitFor(() => {
            expect(container.firstChild).toBeNull()
        })
    })

    it('renders AdyenCheckoutProvider and AdyenCheckout with correct props', async () => {
        const mockNavigate = jest.fn()
        useNavigation.mockReturnValue(mockNavigate)
        const {findByTestId} = render(<AdyenCheckoutRedirectContainer />)
        // Wait for async token
        await findByTestId('adyen-provider')
        expect(AdyenCheckoutProvider).toHaveBeenCalledWith(
            expect.objectContaining({
                authToken: 'token123',
                customerId: 'customer123',
                locale: 'en-US',
                site: 'site123',
                basket: {id: 'basket123'},
                navigate: mockNavigate
            }),
            expect.anything()
        )
        expect(AdyenCheckout).toHaveBeenCalledWith(
            expect.objectContaining({showLoading: true}),
            expect.anything()
        )
    })
})
