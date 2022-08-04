/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {ReactElement} from 'react'
import {CommerceApiProvider} from 'commerce-sdk-react'
import {QueryClient, QueryClientProvider, hydrate, dehydrate} from '@tanstack/react-query'

interface AppConfigProps {
    locals: {
        queryClient: QueryClient
    }
    children: React.ReactNode
}

const isServer = typeof window === 'undefined'

const AppConfig = (props: AppConfigProps): ReactElement => {
    return (
        <QueryClientProvider client={props.locals.queryClient}>
            <CommerceApiProvider
                siteId="RefArchGlobal"
                shortCode="8o7m175y"
                clientId="c9c45bfd-0ed3-4aa2-9971-40f88962b836"
                organizationId="f_ecom_zzrf_001"
                proxy="http://localhost:3000/mobify/proxy/api"
                locale="en-US"
                currency="USD"
            >
                {props.children}
            </CommerceApiProvider>
        </QueryClientProvider>
    )
}

AppConfig.restore = (locals) => {
    const queryClient = new QueryClient()

    // Hydrate the client with the frozen state.
    // @ts-ignore
    hydrate(queryClient, isServer ? {} : window.__PRELOADED_STATE__.__STATE_MANAGEMENT_LIBRARY)

    // Assign to locals to be used in "freeze".
    locals.queryClient = queryClient
}

AppConfig.freeze = async (locals) => {
    const {queryClient} = locals
    console.log('Freeze!')
    await Promise.all(queryClient.queryCache.queries.map((q) => q.fetch()))

    const dehydratedState = dehydrate(queryClient)
    console.log('dehydrated: ', dehydratedState)
    return dehydratedState
}
AppConfig.extraGetPropsArgs = () => {}

export default AppConfig
