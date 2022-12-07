/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, ReactElement} from 'react'
// @ts-ignore
import {CommerceApiProvider} from 'commerce-sdk-react-preview'
// @ts-ignore
import {withReactQuery} from 'pwa-kit-react-sdk/ssr/universal/components/with-react-query'
// @ts-ignore
import {useCorrelationId} from 'pwa-kit-react-sdk/ssr/universal/hooks'

interface AppConfigProps {
    children: React.ReactNode
}

const AppConfig = (props: AppConfigProps): ReactElement => {
    const {correlationId} = useCorrelationId()
    const headers = {
        'correlation-id': correlationId
    }
    const defaultSiteId = 'RefArchGlobal'
    const defaultLocale = 'en-US'
    const [siteId, setSiteId] = useState(defaultSiteId)
    const [locale, setLocale] = useState(defaultLocale)
    const anotherSite = siteId === defaultSiteId ? 'RefArch' : defaultSiteId
    const anotherLocale = locale === defaultLocale ? 'en-CA' : defaultLocale
    return (
        <CommerceApiProvider
            siteId={siteId}
            shortCode="8o7m175y"
            clientId="c9c45bfd-0ed3-4aa2-9971-40f88962b836"
            organizationId="f_ecom_zzrf_001"
            redirectURI="http://localhost:3000/callback"
            proxy="http://localhost:3000/mobify/proxy/api"
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
