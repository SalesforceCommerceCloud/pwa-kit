/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, RenderOptions} from '@testing-library/react'
import {renderHook, RenderResult} from '@testing-library/react-hooks/dom'
import {
    QueryClient,
    QueryClientProvider,
    UseMutationResult,
    UseQueryResult
} from '@tanstack/react-query'
import nock from 'nock'
import CommerceApiProvider, {CommerceApiProviderProps} from './provider'
import {CacheUpdateMatrixElement} from './hooks/ShopperBaskets/utils'

// Note: this host does NOT exist
// it is intentional b/c we can catch those unintercepted requests
// from log easily. You should always make sure all requests are nocked.
export const DEFAULT_TEST_HOST = 'http://localhost:8888'

export const DEFAULT_TEST_CONFIG = {
    proxy: `${DEFAULT_TEST_HOST}/mobify/proxy/api`,
    redirectURI: `${DEFAULT_TEST_HOST}/callback`,
    clientId: '12345678-1234-1234-1234-123412341234',
    organizationId: 'f_ecom_zzrmy_orgf_001',
    shortCode: '12345678',
    siteId: 'RefArchGlobal',
    locale: 'en-US',
    currency: 'USD'
}

export const createQueryClient = () => {
    return new QueryClient({
        // During testing, we want things to fail immediately
        defaultOptions: {queries: {retry: false}, mutations: {retry: false}}
    })
}

type TestProviderProps = Partial<CommerceApiProviderProps & {queryClient: QueryClient}>

const TestProviders = (props: TestProviderProps) => {
    const queryClient = props.queryClient || createQueryClient()
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
    props?: TestProviderProps,
    options?: Omit<RenderOptions, 'wrapper'>
): void => {
    render(children, {
        // eslint-disable-next-line react/display-name
        wrapper: ({children}: {children?: React.ReactNode}) => (
            <TestProviders {...props}>{children}</TestProviders>
        ),
        ...options
    })
}

/**
 * Render your hook, which will be wrapped with all the necessary Provider components
 *
 * @param children
 * @param props - additional props to pass to providers in TestProvider component
 * @param options - additional options for testing-library's render function
 */
export function renderHookWithProviders<TProps, TResult>(
    callback: (props: TProps) => TResult,
    props?: TestProviderProps
) {
    return renderHook(callback, {
        // eslint-disable-next-line react/display-name
        wrapper: ({children}: {children?: React.ReactNode}) => (
            <TestProviders {...props}>{children}</TestProviders>
        )
    })
}

export const NEW_DATA = {test: 'new data'}
export const OLD_DATA = {test: 'old data'}

export const mockMutationEndpoints = (matchingPath: string, options?: {errorResponse: number}) => {
    const responseStatus = options?.errorResponse ? options.errorResponse : 200

    nock(DEFAULT_TEST_HOST)
        .patch((uri) => {
            return uri.includes(matchingPath)
        })
        .reply(responseStatus, NEW_DATA)
        .put((uri) => {
            return uri.includes(matchingPath)
        })
        .reply(responseStatus, NEW_DATA)
        .post((uri) => {
            return uri.includes(matchingPath)
        })
        .reply(responseStatus, NEW_DATA)
        .delete((uri) => {
            return uri.includes(matchingPath)
        })
        .reply(options?.errorResponse ? options.errorResponse : 204)
}

export const assertUpdateQuery = (
    queryResult: UseQueryResult,
    newData: Record<string, unknown>
) => {
    // query should be updated without a refetch
    expect(queryResult.data).toEqual(newData)
    expect(queryResult.isRefetching).toBe(false)
}

export const assertInvalidateQuery = (
    queryResult: UseQueryResult,
    oldData: Record<string, unknown>
) => {
    // query should be invalidated and refetching
    expect(queryResult.data).toEqual(oldData)
    expect(queryResult.isRefetching).toBe(true)
}

export const assertRemoveQuery = (queryResult: UseQueryResult) => {
    expect(queryResult.data).not.toBeDefined()
}
