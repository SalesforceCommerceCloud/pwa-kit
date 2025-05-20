/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect, useRef} from 'react'
import {useBlockNavigation, useRoutes} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import {useUrlMapping, useConfig} from '@salesforce/commerce-sdk-react'
import {useLocation} from 'react-router-dom'
import {useApplicationExtensionsStore} from '@salesforce/pwa-kit-extension-sdk/react'
import {useExtensionConfig} from '../hooks/use-extension-config'
import {handleNavigationBlock} from '../utils/route-utils'
import {matchPath} from '../utils/route-match-utils'
import {ROUTING_MODE} from '../constants'
import type {Config} from '../types/config'

type WithSeoProps = React.ComponentPropsWithoutRef<any>

const withSeo = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithSeo: React.FC<P> = (props: WithSeoProps) => {
        const location = useLocation()
        const {routes, setRoutes} = useRoutes()
        const {resourceTypeToComponentMap, routingMode} = useExtensionConfig() as Config
        const siteConfig = useConfig()
        const [urlSegment, setUrlSegment] = useState(location.pathname)
        const {setIsNavigationBlocked} = useApplicationExtensionsStore((state) => {
            return state.state['@salesforce/extension-commerce-bm-seo']
        })
        const resolveRef = useRef<(result?: object) => void>()

        // If routingMode is "router_first" and a predefined route matches, skip the getUrlMapping API call.
        const skipMappingCall = Boolean(
            routingMode === ROUTING_MODE.ROUTER_FIRST &&
                matchPath(location.pathname, routes, {filterWildcardRoutes: true})
        )

        // Disabling the hook on render so it's only called when refetch is called
        const {refetch} = useUrlMapping(
            {
                parameters: {
                    urlSegment: urlSegment,
                    locale: siteConfig.locale
                }
            },
            {
                enabled: false
            }
        )

        useEffect(() => {
            const fetchData = async () => {
                if (!urlSegment) {
                    return
                }
                if (skipMappingCall) {
                    return
                }
                const result = await refetch()
                if (!resolveRef.current) return
                if (!result || result.status === 'error') {
                    resolveRef.current(undefined)
                    return
                }
                if (result.data?.destinationUrl) {
                    resolveRef.current(result.data)
                } else {
                    resolveRef.current(undefined)
                }
            }
            void fetchData().catch(console.error)
        }, [urlSegment, skipMappingCall])

        const {isBlocked: isNavigationBlocked} = useBlockNavigation(
            async (location: Location, _: string) =>
                handleNavigationBlock(
                    location,
                    skipMappingCall,
                    setUrlSegment,
                    resolveRef,
                    routes,
                    resourceTypeToComponentMap,
                    setRoutes
                )
        )

        // Inform other areas of the app (e.g. other extensions) when navigation is being blocked by SEO logic
        useEffect(() => {
            setIsNavigationBlocked(isNavigationBlocked)
        }, [isNavigationBlocked])

        return <WrappedComponent {...(props as P)} />
    }

    return WithSeo
}

export default withSeo
