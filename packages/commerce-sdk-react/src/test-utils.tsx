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

export const DEFAULT_TEST_CONFIG = {
    proxy: 'http://localhost:8888/mobify/proxy/api',
    clientId: '12345678-1234-1234-1234-123412341234',
    organizationId: 'f_ecom_zzrmy_orgf_001',
    shortCode: '12345678',
    redirectURI: 'http://localhost:8888/callback',
    siteId: 'RefArchGlobal',
    locale: 'en-US',
    currency: 'USD'
}
const TestProviders = (props: Partial<CommerceApiProviderProps>) => {
    const queryClient = new QueryClient({
        // During testing, we want things to fail immediately
        defaultOptions: {queries: {retry: false}, mutations: {retry: false}}
    })
    return (
        <QueryClientProvider client={queryClient}>
            <CommerceApiProvider {...DEFAULT_TEST_CONFIG} {...props}>
                {props.children}
            </CommerceApiProvider>
        </QueryClientProvider>
    )
}

/**
 * Render your component, which will be wrapped with all the necessary Provider components
 *
 * @param children
 * @param props - additional props to pass to providers in TestProvider component
 * @param options - additional options for testing-library's render function
 */
export const renderWithProviders = (
    children: React.ReactElement,
    props?: Partial<CommerceApiProviderProps>,
    options?: Omit<RenderOptions, 'wrapper'>
): void => {
    render(children, {
        // eslint-disable-next-line react/display-name
        wrapper: ({children}) => <TestProviders {...props}>{children}</TestProviders>,
        ...options
    })
}
