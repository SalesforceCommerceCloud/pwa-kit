/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Returns true if the given shipment is configured for pickup-in-store.
 * Uses a null-safe check on the custom field c_storePickupEnabled on the shipping method.
 *
 * @param {object} shipment
 * @returns {boolean}
 */
export const isPickupShipment = (shipment) =>
    Boolean(shipment?.shippingMethod?.c_storePickupEnabled)
