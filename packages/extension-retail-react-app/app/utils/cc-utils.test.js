/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as utils from '@salesforce/retail-react-app/app/utils/cc-utils'

test('formatCreditCardNumber returns number with proper spaces', () => {
    const opts = {
        gaps: [4, 8, 12],
        lengths: [16]
    }

    expect(utils.formatCreditCardNumber('41111111111111111', opts)).toBe('4111 1111 1111 1111')
    expect(utils.formatCreditCardNumber('4111111111111111', opts)).toBe('4111 1111 1111 1111')
    expect(utils.formatCreditCardNumber('411111111111', opts)).toBe('4111 1111 1111')
    expect(utils.formatCreditCardNumber('4', opts)).toBe('4')
    expect(utils.formatCreditCardNumber('', opts)).toBe('')
    expect(utils.formatCreditCardNumber('')).toBe('')
    expect(utils.formatCreditCardNumber()).toBe('')
})

test('getCreditCardIcon returns icon component for given card type', () => {
    expect(utils.getCreditCardIcon()).toBeUndefined()
    expect(utils.getCreditCardIcon('visa').displayName).toBe('CcVisaIcon')
    expect(utils.getCreditCardIcon('mastercard').displayName).toBe('CcMastercardIcon')
    expect(utils.getCreditCardIcon('master card').displayName).toBe('CcMastercardIcon')
    expect(utils.getCreditCardIcon('amex').displayName).toBe('CcAmexIcon')
    expect(utils.getCreditCardIcon('american express').displayName).toBe('CcAmexIcon')
    expect(utils.getCreditCardIcon('american-express').displayName).toBe('CcAmexIcon')
    expect(utils.getCreditCardIcon('discover').displayName).toBe('CcDiscoverIcon')
})

test('getPaymentInstrumentCardType maps card type names to API requirements', () => {
    expect(utils.getPaymentInstrumentCardType()).toBeUndefined()
    expect(utils.getPaymentInstrumentCardType('visa')).toBe('Visa')
    expect(utils.getPaymentInstrumentCardType('mastercard')).toBe('Master Card')
    expect(utils.getPaymentInstrumentCardType('american-express')).toBe('Amex')
    expect(utils.getPaymentInstrumentCardType('discover')).toBe('Discover')
})
