/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useReducer} from 'react'
import {Helmet} from 'react-helmet'

/** Origins that are allowed to run Storefront Preview. */
const TRUSTED_ORIGINS = [
    'https://runtime.commercecloud.com',
    'https://runtime-admin-staging.mobify-storefront.com',
    'https://runtime-admin-preview.mobify-storefront.com'
]

/** Detects whether the storefront is running in an iframe as part of Storefront Preview. */
const detectStorefrontPreview = () => {
    if (typeof window === 'undefined' || window.parent === window.self) return false
    const parentOrigin = window.location.ancestorOrigins?.[0] ?? new URL(document.referrer).origin
    return TRUSTED_ORIGINS.includes(parentOrigin)
}

/**
 * Initializes the `window.STOREFRONT_PREVIEW` object and returns a component that will create the
 * connection to Runtime Admin.
 * @param {object} customizations - Customizations to the Storefront Preview behavior
 * @param {boolean} enabled - Whether Storefront Preview is enabled. Defaults to detecting whether
 * the storefront is framed by Runtime Admin.
 */
export const useStorefrontPreview = (customizations = {}, enabled = detectStorefrontPreview()) => {
    const [, forceUpdate] = useReducer((x) => x + 1, 0)
    const defaults = {
        rerender: () => forceUpdate()
    }

    useEffect(() => {
        if (enabled) {
            window.STOREFRONT_PREVIEW = {
                ...defaults,
                ...window.STOREFRONT_PREVIEW,
                ...customizations
            }
        }
        return () => {
            // Avoid exposing the ability to re-render the wrong thing.
            if (window.STOREFRONT_PREVIEW?.rerender === defaults.rerender) {
                window.STOREFRONT_PREVIEW.rerender = () => {}
            }
        }
    }, [enabled, forceUpdate])

    const StorefrontPreview = () =>
        enabled && (
            <Helmet>
                <script
                    src="https://runtime.commercecloud.com/cc/b2c/preview/preview.client.js"
                    type="text/javascript"
                ></script>
            </Helmet>
        )

    return StorefrontPreview
}
