/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Express Payments Proxy - Route Registration
 *
 * This module exports a function to register all Express Payments proxy endpoints
 * on the Express application. These endpoints extract SLAS tokens from HTTP-only
 * cookies, ensuring tokens are never exposed to client-side JavaScript.
 */

import {registerShippingAddressRoutes} from './shipping-address.js'
import {registerShippingMethodsRoutes} from './shipping-methods.js'
import {registerPaymentsRoutes} from './payments.js'
import {registerBasketsRoutes} from './baskets.js'

/**
 * Registers all Express Payments proxy endpoints on the Express app.
 *
 * Endpoints registered:
 * - PUT  /api/express/baskets/:basketId/shipping-address
 * - GET  /api/express/baskets/:basketId/shipping-methods
 * - PUT  /api/express/baskets/:basketId/shipping-methods
 * - POST /api/express/payments
 * - POST /api/express/baskets/temporary
 * - GET  /api/express/baskets/:basketId
 * - DELETE /api/express/baskets/:basketId
 * - POST /api/express/baskets/:basketId/calculate
 *
 * @param {Object} app - Express app instance
 */
export const registerExpressProxyEndpoints = (app) => {
    console.log('[Express Proxy] Registering secure proxy endpoints...')

    // Register basket routes first (more specific routes like /temporary)
    registerBasketsRoutes(app)

    // Register shipping routes
    registerShippingAddressRoutes(app)
    registerShippingMethodsRoutes(app)

    // Register payment routes
    registerPaymentsRoutes(app)

    console.log('[Express Proxy] Secure proxy endpoints registered successfully')
}

export {registerShippingAddressRoutes} from './shipping-address.js'
export {registerShippingMethodsRoutes} from './shipping-methods.js'
export {registerPaymentsRoutes} from './payments.js'
export {registerBasketsRoutes} from './baskets.js'
