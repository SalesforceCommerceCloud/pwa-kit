/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {isServer} from '@tanstack/react-query'

/** Origins that are allowed to run Storefront Preview. */
const TRUSTED_ORIGINS = [
    'https://runtime.commercecloud.com',
    'https://runtime-admin-staging.mobify-storefront.com',
    'https://runtime-admin-preview.mobify-storefront.com'
]

/** Origin used for local Runtime Admin. */
const DEVELOPMENT_ORIGIN = 'http://localhost:4000'

/** Detects whether the storefront is running in an iframe. */
const detectInIframe = () => typeof window !== 'undefined' && window.parent !== window.self

/** Gets the parent origin when running in an iframe. */
const getParentOrigin = () => {
    if (detectInIframe()) {
        if (window.location.ancestorOrigins) return window.location.ancestorOrigins[0]
        // ancestorOrigins does not exist in Firefox, so we use referrer as a fallback
        if (document.referrer) return new URL(document.referrer).origin
    }
}

const isParentOriginTrusted = (parentOrigin) => {
    return window.location.hostname === 'localhost'
        ? parentOrigin === DEVELOPMENT_ORIGIN // Development
        : TRUSTED_ORIGINS.includes(parentOrigin) // Production
}

/** Detects whether the storefront is running in an iframe as part of Storefront Preview. */
export const detectStorefrontPreview = () => {
    const parentOrigin = getParentOrigin()
    return Boolean(parentOrigin) && isParentOriginTrusted(parentOrigin)
}

/** Returns the URL to load the Storefront Preview client script from the parent origin. */
export const getClientScript = () => {
    const parentOrigin = getParentOrigin() ?? 'https://runtime.commercecloud.com'
    return parentOrigin === DEVELOPMENT_ORIGIN
        ? `${parentOrigin}/mobify/bundle/development/static/storefront-preview.js`
        : `${parentOrigin}/cc/b2c/preview/preview.client.js`
}
export const StorefrontPreview = ({
    // Note: how to get access to MRT env on client-side?
    // enabled = process?.env?.STOREFRONT_PREVIEW || false,
    enabled = false,
    customisation
}) => {
    // Can we do this? process is not defined on client side.
    // do not run preview feature if STOREFRONT_PREVIEW variable is not turned on in MRT env
    if (!enabled) {
        return null
    }
    useEffect(() => {
        if (enabled) {
            const isHostTrusted = detectStorefrontPreview()
            if (isHostTrusted) {
                window.STOREFRONT_PREVIEW = {
                    ...window.STOREFRONT_PREVIEW,
                    ...customisation
                }
            }
        }
    }, [enabled])

    return (
        <>
            {!isServer && enabled && (
                <Helmet>
                    <script src={getClientScript()} type="text/javascript"></script>
                </Helmet>
            )}
        </>
    )
}

StorefrontPreview.propTypes = {
    enabled: PropTypes.bool.isRequired,
    customisation: PropTypes.object
}
