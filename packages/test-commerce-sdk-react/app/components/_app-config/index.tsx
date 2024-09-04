/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, ReactElement} from 'react'
import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'
import {withReactQuery} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-react-query'
import {useCorrelationId} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import {proxyBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'

interface AppConfigProps {
    children: React.ReactNode
}

const AppConfig = (props: AppConfigProps): ReactElement => {
    const {correlationId} = useCorrelationId()
    const headers = {
        'correlation-id': correlationId
    }
    const defaultSiteId = 'RefArch'
    const defaultLocale = 'en-US'
    const [siteId, setSiteId] = useState(defaultSiteId)
    const [locale, setLocale] = useState(defaultLocale)
    const anotherSite = siteId === defaultSiteId ? 'RefArch' : defaultSiteId
    const anotherLocale = locale === defaultLocale ? 'en-CA' : defaultLocale
    return (
        <CommerceApiProvider
            siteId={siteId}
            shortCode="kv7kzm78"
            clientId="4afbc51f-6423-41c8-8b29-d7f2825b5bee"
            organizationId="f_ecom_zzrf_006"
            redirectURI="http://localhost:3000/callback"
            proxy={`http://localhost:3000/${String(proxyBasePath)}/api`}
            locale={locale}
            currency="USD"
            headers={headers}
        >
            {props.children}
            <div
                style={{
                    backgroundColor: '#ebebeb',
                    position: 'fixed',
                    right: 0,
                    bottom: 0,
                    margin: '8px'
                }}
            >
                <h3>Site: {siteId}</h3>
                <button
                    onClick={() => {
                        setSiteId(anotherSite)
                    }}
                >
                    Switch to {anotherSite}
                </button>
                <button
                    onClick={() => {
                        setLocale(anotherLocale)
                    }}
                >
                    Switch to {anotherLocale}
                </button>
            </div>
        </CommerceApiProvider>
    )
}

AppConfig.restore = () => {}
AppConfig.extraGetPropsArgs = () => {}
AppConfig.freeze = () => {}

const isServerSide = typeof window === 'undefined'

// Recommended settings for PWA-Kit usages.
// NOTE: they will be applied on both server and client side.
const options = {
    queryClientConfig: {
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 2 * 1000,
                ...(isServerSide ? {retryOnMount: false} : {}),
                // Option for debugging changes in cache with React Query Dev Tools
                refetchOnWindowFocus: false
            },
            mutations: {
                retry: false
            }
        }
    }
}

export default withReactQuery(AppConfig, options)
