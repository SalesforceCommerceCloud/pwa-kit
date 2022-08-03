/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {QueryClient, QueryClientProvider, hydrate, dehydrate} from '@tanstack/react-query'

/**
 * Use the AppConfig component to inject extra arguments into the getProps
 * methods for all Route Components in the app – typically you'd want to do this
 * to inject a connector instance that can be used in all Pages.
 *
 * You can also use the AppConfig to configure a state-management library such
 * as Redux, or Mobx, if you like.
 */

const isServer = typeof window === 'undefined'

interface Props {
    children: any,
    locals: any
}

const AppConfig = ({children, locals = {}}: Props) => {
    return (
        <QueryClientProvider client={locals.queryClient}>
            {children}
        </QueryClientProvider>
    )
}

AppConfig.restore = (locals = {}) => {
    const queryClient = new QueryClient()

    // Hydrate the client with the frozen state.
    hydrate(queryClient, isServer ? {} : window.__PRELOADED_STATE__.__STATE_MANAGEMENT_LIBRARY)

    // Assign to locals to be used in "freeze".
    locals.queryClient = queryClient
}

AppConfig.freeze = async (locals = {}) => {
    const {queryClient} = locals
    console.log('Freeze!')
    await Promise.all(queryClient.queryCache.queries.map((q => q.fetch())))

    const dehydratedState = dehydrate(queryClient)
    console.log('dehydrated: ', dehydratedState)
    return dehydratedState
}

AppConfig.extraGetPropsArgs = (locals = {}) => {
    return {}
}

export default AppConfig
