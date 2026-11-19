/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    createWalletLaunch,
    walletBasketVersion,
    readWalletLaunch,
    removeWalletLaunch,
    validateWalletLaunch
} from '@salesforce/retail-react-app/app/utils/commerce-client-wallet'

const basket = {
    basketId: 'basket',
    currency: 'USD',
    orderTotal: 15,
    productItems: [{itemId: 'line', quantity: 1}],
    shipments: [{shipmentId: 'me'}]
}

beforeEach(() => {
    window.sessionStorage.clear()
    Object.defineProperty(window.crypto, 'randomUUID', {
        value: () => 'launch-id',
        configurable: true
    })
})
it('binds the launch URL to the shopper and complete basket version without putting shopper data in the URL', () => {
    const result = createWalletLaunch({
        basket,
        identity: 'shopper-a',
        url: '/en-US/Payments-Express'
    })
    expect(result.url).toBe('/en-US/Payments-Express?launch=launch-id')
    const launch = readWalletLaunch(result.id)
    expect(launch).toMatchObject({
        identity: 'shopper-a',
        basketId: 'basket',
        version: walletBasketVersion(basket)
    })
    expect(validateWalletLaunch({launch, identity: 'shopper-a', basket})).toBe(basket)
    expect(() => validateWalletLaunch({launch, identity: 'shopper-b', basket})).toThrow()
    expect(() =>
        validateWalletLaunch({launch, identity: 'shopper-a', basket: {...basket, orderTotal: 16}})
    ).toThrow()
    removeWalletLaunch(result.id)
    expect(readWalletLaunch(result.id)).toBeNull()
})
it('expires launches and fails closed for ineligible baskets', () => {
    expect(
        createWalletLaunch({
            basket: {...basket, orderTotal: null},
            identity: 'a',
            url: '/Payments-Express'
        })
    ).toBeNull()
    expect(
        createWalletLaunch({
            basket: {...basket, shipments: [{c_fromStoreId: 'store'}]},
            identity: 'a',
            url: '/Payments-Express'
        })
    ).toBeNull()
    const result = createWalletLaunch({basket, identity: 'a', url: '/Payments-Express'})
    const now = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 16 * 60 * 1000)
    expect(readWalletLaunch(result.id)).toBeNull()
    now.mockRestore()
})

it('does not persist addresses, shopper email, or payment details with a launch', () => {
    const result = createWalletLaunch({
        basket: {
            ...basket,
            billingAddress: {address1: 'private address'},
            customerInfo: {email: 'private@example.test'},
            paymentInstruments: [{paymentCard: {number: 'private card'}}]
        },
        identity: 'a',
        url: '/Payments-Express'
    })
    const stored = JSON.stringify(readWalletLaunch(result.id))
    expect(stored).not.toContain('private')
})
