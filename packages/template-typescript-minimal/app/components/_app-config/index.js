/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {withLegacyGetProps} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-legacy-get-props'
import {withReactQuery} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-react-query'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'
import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'

const AppConfig = ({children, locals = {}}) => {
    const appOrigin = getAppOrigin()
    return (
        <CommerceApiProvider
            shortCode="8o7m175y"
            clientId="c9c45bfd-0ed3-4aa2-9971-40f88962b836"
            organizationId="f_ecom_zzrf_001"
            siteId="RefArchGlobal"
            locale={locals.locale?.id}
            currency={locals.locale?.preferredCurrency}
            redirectURI={`${appOrigin}/callback`}
            proxy={`${appOrigin}/mobify/proxy/api`}
        >
            {children}
        </CommerceApiProvider>
    )
}

AppConfig.restore = (locals = {}) => {}

AppConfig.freeze = () => undefined

AppConfig.extraGetPropsArgs = (locals = {}) => {
    return {}
}

AppConfig.propTypes = {
    children: PropTypes.node,
    locals: PropTypes.object
}

const isServerSide = typeof window === 'undefined'

// Recommended settings for PWA-Kit usages.
// NOTE: they will be applied on both server and client side.
const options = {
    queryClientConfig: {
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 2 * 1000,
                ...(isServerSide ? {retryOnMount: false} : {})
            },
            mutations: {
                retry: false
            }
        }
    }
}

export default withReactQuery(withLegacyGetProps(AppConfig), options)
