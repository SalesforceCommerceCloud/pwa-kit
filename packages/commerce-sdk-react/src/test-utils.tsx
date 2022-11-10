/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {render, RenderOptions} from '@testing-library/react'
import React from 'react'
import CommerceApiProvider, {CommerceApiProviderProps} from './provider'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

export const TEST_CONFIG = {
    proxy: 'http://localhost:3000/mobify/proxy/api',
    clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
    organizationId: 'f_ecom_zzrf_001',
    shortCode: '8o7m175y',
    redirectURI: 'http://localhost:3000/callback',
    siteId: 'RefArchGlobal',
    locale: 'en-US',
    currency: 'USD'
}
const TestProviders = (props: {
    children: React.ReactNode
    commerceApiProvider?: Partial<CommerceApiProviderProps>
}) => {
    const {commerceApiProvider} = props
    const queryClient = new QueryClient({
        // During testing, we want things to fail immediately
        defaultOptions: {queries: {retry: false}, mutations: {retry: false}}
    })
    return (
        <QueryClientProvider client={queryClient}>
            <CommerceApiProvider {...TEST_CONFIG} {...commerceApiProvider}>
                {props.children}
            </CommerceApiProvider>
        </QueryClientProvider>
    )
}

/**
 * Render your component, which will be wrapped with all the necessary Provider components
 *
 * @param children
 * @param options - additional options for testing-library's render function
 * @param providerProps - additional props to pass to providers in TestProvider component
 */
export const renderWithProviders = (
    children: React.ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>,
    providerProps?: {
        commerceApiProvider?: Partial<CommerceApiProviderProps>
    }
): void => {
    render(children, {
        // eslint-disable-next-line react/display-name
        wrapper: () => <TestProviders {...providerProps}>{children}</TestProviders>,
        ...options
    })
}
