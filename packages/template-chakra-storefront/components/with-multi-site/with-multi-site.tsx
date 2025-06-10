/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {ServerContext} from '@salesforce/commerce-sdk-react/hooks/types'

// Platform Imports
import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'

// Local
import {createUrlTemplate} from '../../utils/url'
import {MultiSiteProvider} from '../../contexts'
import {resolveSiteFromUrl, resolveLocaleFromUrl} from '../../utils/site-utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// Define a type for the HOC props
type WithMultiSiteProps = React.ComponentPropsWithoutRef<any>

// Define the HOC function
const withMultiSite = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const WithMultiSite: React.FC<P> = (props: WithMultiSiteProps) => {
        const {req} = useServerContext() as ServerContext
        const path = req?.originalUrl || `${window.location.pathname}${window.location.search}`

        const config: any = getConfig()
        const site: any = resolveSiteFromUrl(path)
        const locale: any = resolveLocaleFromUrl(path)
        const buildUrl = createUrlTemplate(config, site.alias || site.id, locale.id)

        return (
            <MultiSiteProvider site={site} locale={locale} buildUrl={buildUrl}>
                <WrappedComponent {...(props as P)} />
            </MultiSiteProvider>
        )
    }

    return WithMultiSite
}

export default withMultiSite
