/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    COMMERCE_CLIENT_PRODUCT_TILE_TAG,
    registerCommerceClientProductTile
} from '@salesforce/retail-react-app/app/components/shopper-agent/overrides/product-tile-element'

/**
 * Flat map of Commerce Client override keys to the custom element tag names that
 * render them. `ProductTile` and `ProductCarousel` are the keys the widget's
 * product blocks look for; any other key is matched against a custom-action
 * block's `output_name`.
 *
 * Passed to the widget as `overrides`, which is the inline alternative to
 * hosting an override script and pointing `cc_overridesUrl` at it.
 */
export const COMMERCE_CLIENT_OVERRIDES = {
    ProductTile: COMMERCE_CLIENT_PRODUCT_TILE_TAG
}

/**
 * Registers every custom element referenced by {@link COMMERCE_CLIENT_OVERRIDES}.
 * Must run before the widget is injected, and is a no-op outside the browser.
 *
 * @returns {boolean} True when all overrides are registered and usable
 */
export const registerCommerceClientOverrides = () => registerCommerceClientProductTile()
