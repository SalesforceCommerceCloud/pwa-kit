/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {AmexIcon, DiscoverIcon, MastercardIcon, VisaIcon} from '../components/icons'

/**
 * Formats a credit card number against given criteria
 * @param {string} cardNumber - The number to be formatted
 * @param {Object} opts
 * @param {number[]} opts.gaps - Indices for space insertion
 * @param {number[]} opts.length - Max number lengths for output
 * @returns {string} Formatted card number for display
 */
export const formatCreditCardNumber = (cardNumber = '', opts = {gaps: [], lengths: []}) => {
    let trimmedNumber = cardNumber.replace(/[^0-9]/g, '')
    let numberLength = trimmedNumber.length

    if (numberLength === opts.lengths[0] + 1) {
        trimmedNumber = trimmedNumber.substr(0, opts.lengths[0])
        numberLength = trimmedNumber.length
    }

    let numbers = trimmedNumber.split('')

    opts.gaps.forEach((gapIndex, idx) => {
        if (numberLength > gapIndex) {
            numbers.splice(gapIndex + idx, 0, ' ')
        }
    })

    return numbers.join('')
}

/**
 * Returns the icon component for a given card type
 * @param {string} type - The card type
 * @returns {Function|undefined} React component
 */
export const getCreditCardIcon = (type) => {
    if (!type) {
        return undefined
    }
    return {
        // Visa
        visa: VisaIcon,

        // MasterCard
        mastercard: MastercardIcon,
        'master card': MastercardIcon,

        // American Express
        'american express': AmexIcon,
        'american-express': AmexIcon,
        amex: AmexIcon,

        // Discover
        discover: DiscoverIcon
    }[type.toLowerCase()]
}

/**
 * Returns the card type string in the format the SDK expects.
 * @param {string} - The card type as given by our cc validator
 * @returns {string|undefined} - The card type in a format expected by the SDK
 */
export const getPaymentInstrumentCardType = (type) => {
    if (!type) {
        return undefined
    }
    return {
        visa: 'Visa',
        mastercard: 'Master Card',
        'american-express': 'Amex',
        discover: 'Discover'
    }[type]
}

export const createCreditCardPaymentBodyFromForm = (paymentFormData) => {
    // eslint-disable-next-line no-unused-vars
    const {expiry, paymentInstrumentId, ...selectedPayment} = paymentFormData

    // The form gives us the expiration date as `MM/YY` - so we need to split it into
    // month and year to submit them as individual fields.
    const [expirationMonth, expirationYear] = expiry.split('/')

    return {
        paymentMethodId: 'CREDIT_CARD',
        paymentCard: {
            ...selectedPayment,
            number: selectedPayment.number.replace(/ /g, ''),
            cardType: getPaymentInstrumentCardType(selectedPayment.cardType),
            expirationMonth: parseInt(expirationMonth),
            expirationYear: parseInt(`20${expirationYear}`),

            // TODO: These fields are required for saving the card to the customer's
            // account. Im not sure what they are for or how to get them, so for now
            // we're just passing some values to make it work. Need to investigate.
            issueNumber: '',
            validFromMonth: 1,
            validFromYear: 2020
        }
    }
}
