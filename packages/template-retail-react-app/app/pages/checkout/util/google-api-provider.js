/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {APIProvider} from '@vis.gl/react-google-maps'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

/**
 * Resolve the Google Cloud API key from the configurations
 * User-defined environment variable (GOOGLE_CLOUD_API_KEY) always take precedence over the platform provided key
 * If no custom key is set, the platform provided key is used (only if feature toggle is enabled in production)
 */
function resolveGoogleCloudAPIKey(configurations) {
    const customKey = getConfig()?.app?.googleCloudAPI?.apiKey
    if (customKey) {
        return customKey
    }

    const platformProvidedKey = configurations?.configurations?.find(
        (config) => config.id === 'gcp'
    )?.value

    return platformProvidedKey
}

export const GoogleAPIProvider = ({children}) => {
    const {configurations} = useCheckout()
    const googleCloudAPIKey = resolveGoogleCloudAPIKey(configurations)

    return googleCloudAPIKey ? (
        <APIProvider apiKey={googleCloudAPIKey}>{children}</APIProvider>
    ) : (
        children
    )
}

GoogleAPIProvider.propTypes = {
    googleCloudAPIKey: PropTypes.string,
    children: PropTypes.node.isRequired
}
