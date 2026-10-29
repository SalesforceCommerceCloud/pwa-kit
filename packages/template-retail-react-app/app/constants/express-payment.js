/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Identifies the host experience so express-payment implementations can adapt
// presentation behavior without depending on a particular provider or feature.
export const EXPRESS_PAYMENT_MODES = Object.freeze({
    STOREFRONT: 'storefront',
    SHOPPER_AGENT: 'shopper-agent'
})
