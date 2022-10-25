/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {withLegacyGetProps} from 'pwa-kit-react-sdk/ssr/universal/components/with-legacy-get-props'
import {withReactQuery} from 'pwa-kit-react-sdk/ssr/universal/components/with-react-query'
import AppConfig from 'pwa-kit-react-sdk/ssr/universal/components/_app-config'

// Recommended settings for PWA-Kit usages.
// NOTE: they will be applied on both server and client side.
const options = {
    queryClientConfig: {
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 2 * 1000,
                retryOnMount: false
            },
            mutations: {
                retry: false
            }
        }
    }
}

export default withReactQuery(withLegacyGetProps(AppConfig), options)
