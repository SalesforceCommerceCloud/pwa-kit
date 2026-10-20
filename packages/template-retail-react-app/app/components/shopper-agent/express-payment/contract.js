/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import PropTypes from 'prop-types'

// Versions the in-frame shell-to-provider API, not the Commerce Client message protocol.
export const EXPRESS_PAYMENT_PROVIDER_API_VERSION = 1

export const EXPRESS_PAYMENT_SURFACES = Object.freeze({
    CART: 'cart',
    PRODUCT: 'product'
})

export const EXPRESS_PAYMENT_BASKET_STATUSES = Object.freeze({
    LOADING: 'loading',
    READY: 'ready',
    EMPTY: 'empty',
    ERROR: 'error'
})

export const expressPaymentContextPropType = PropTypes.oneOfType([
    PropTypes.shape({
        providerApiVersion: PropTypes.oneOf([EXPRESS_PAYMENT_PROVIDER_API_VERSION]).isRequired,
        surface: PropTypes.oneOf([EXPRESS_PAYMENT_SURFACES.CART]).isRequired,
        siteId: PropTypes.string.isRequired,
        locale: PropTypes.string.isRequired,
        currency: PropTypes.string.isRequired,
        basket: PropTypes.shape({
            id: PropTypes.string,
            status: PropTypes.oneOf(Object.values(EXPRESS_PAYMENT_BASKET_STATUSES)).isRequired
        }).isRequired
    }),
    PropTypes.shape({
        providerApiVersion: PropTypes.oneOf([EXPRESS_PAYMENT_PROVIDER_API_VERSION]).isRequired,
        surface: PropTypes.oneOf([EXPRESS_PAYMENT_SURFACES.PRODUCT]).isRequired,
        siteId: PropTypes.string.isRequired,
        locale: PropTypes.string.isRequired,
        currency: PropTypes.string.isRequired,
        productId: PropTypes.string.isRequired,
        quantity: PropTypes.number.isRequired
    })
])

export const expressPaymentLifecyclePropType = PropTypes.exact({
    available: PropTypes.func.isRequired,
    unavailable: PropTypes.func.isRequired,
    success: PropTypes.func.isRequired,
    failure: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired
})

export const expressPaymentProviderPropTypes = {
    context: expressPaymentContextPropType.isRequired,
    lifecycle: expressPaymentLifecyclePropType.isRequired
}
