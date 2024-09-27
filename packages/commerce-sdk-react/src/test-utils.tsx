/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, RenderOptions, renderHook, waitFor} from '@testing-library/react'
import {
    QueryClient,
    QueryClientProvider,
    UseMutationResult,
    UseQueryResult
} from '@tanstack/react-query'
import nock from 'nock'
import CommerceApiProvider, {CommerceApiProviderProps} from './provider'
import userEvent from '@testing-library/user-event'
import {PROXY_PATH} from './constant'

// Note: this host does NOT exist
// it is intentional b/c we can catch those unintercepted requests
// from log easily. You should always make sure all requests are nocked.
export const DEFAULT_TEST_HOST = 'http://localhost:8888'

export const DEFAULT_TEST_CONFIG = {
    proxy: `${DEFAULT_TEST_HOST}${PROXY_PATH}/api`,
    redirectURI: `${DEFAULT_TEST_HOST}/callback`,
    clientId: '12345678-1234-1234-1234-123412341234',
    organizationId: 'f_ecom_zzrmy_orgf_001',
    shortCode: '12345678',
    siteId: 'RefArchGlobal',
    locale: 'en-US',
    currency: 'USD',
    fetchedToken: 'test-token'
}

export const createQueryClient = () => {
    return new QueryClient({
        logger: {
            ...console,
            error() {
                // Disable error logs as we intentionally cause errors during tests
            }
        },
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
) => {
    const user = userEvent.setup()
    const res = render(children, {
        wrapper: ({children}: {children?: React.ReactNode}) => (
            <TestProviders {...props}>{children}</TestProviders>
        ),
        ...options
    })
    return {user, ...res}
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
        wrapper: ({children}: {children?: React.ReactNode}) => (
            <TestProviders {...props}>{children}</TestProviders>
        )
    })
}

const NOCK_DELAY = 50
/** Mocks DELETE, PATCH, POST, and PUT so we don't have to look up which verb an endpoint uses. */
export const mockMutationEndpoints = (
    matchingPath: string,
    response: string | object | undefined | ((uri: string, requestBody: any) => object),
    statusCode = 200
) => {
    const matcher = (uri: string) => uri.includes(matchingPath)
    // For some reason, re-using scope (i.e. nock() and chained methods)
    // results in duplicate mocked requests, which breaks our validation
    // of # of requests used.

    // For delay(NOCK_DELAY):
    // It sucks that we have to do the delay
    // but since @react-testing-library/react@14, the waitFor
    // method only checks hook result by interval, there is no
    // reliable way to trigger waitFor per re-render.
    // So we need to give the mocks a small delay to ensure that
    // the waitFor have time to catch every re-render.
    nock(DEFAULT_TEST_HOST).delete(matcher).delay(NOCK_DELAY).reply(statusCode, response)
    nock(DEFAULT_TEST_HOST).patch(matcher).delay(NOCK_DELAY).reply(statusCode, response)
    nock(DEFAULT_TEST_HOST).put(matcher).delay(NOCK_DELAY).reply(statusCode, response)
    nock(DEFAULT_TEST_HOST).post(matcher).delay(NOCK_DELAY).reply(statusCode, response)
}

/** Mocks a GET request to an endpoint. */
export const mockQueryEndpoint = (
    matchingPath: string,
    response: string | object | unknown[],
    statusCode = 200
) => {
    const matcher = (uri: string) => uri.includes(matchingPath)
    return nock(DEFAULT_TEST_HOST).get(matcher).delay(NOCK_DELAY).reply(statusCode, response)
}

export const assertUpdateQuery = (
    queryResult: UseQueryResult,
    newData: Record<string, unknown> | unknown[]
) => {
    // query should be updated without a refetch
    expect(queryResult.data).toEqual(newData)
    expect(queryResult.isRefetching).toBe(false)
}

export const assertInvalidateQuery = (
    queryResult: UseQueryResult,
    oldData: Record<string, unknown> | unknown[] | undefined
) => {
    // query should be invalidated and refetching
    expect(queryResult.data).toEqual(oldData)
    expect(queryResult.isRefetching).toBe(true)
}

export const assertRemoveQuery = (queryResult: UseQueryResult) => {
    expect(queryResult.data).not.toBeDefined()
}

const getQueryName = (method: string): string => {
    // Most query endpoints start with 'get';
    const prefix = /^get|^retrieve/
    // If it exists, replace the prefix verb with 'use'
    if (prefix.test(method)) return method.replace(prefix, 'use')
    // Otherwise just prefix the method with 'use' and fix the case
    return method.replace(/^./, (ltr) => `use${ltr.toUpperCase()}`)
}

/**
 * Gets the list of API endpoints that have not yet been implemented
 * @param SdkClass Class constructor from commerce-sdk-isomorphic to use as a source for endpoints
 * @param queryHooks Object containing implemented query hooks
 * @param mutations Enum containing mutation endpoint names
 * @returns List of endpoints that don't have a query or mutation hook
 */
export const getUnimplementedEndpoints = (
    SdkClass: {prototype: object},
    queryHooks: object,
    mutations: object = {}
) => {
    const unimplemented = new Set(Object.getOwnPropertyNames(SdkClass.prototype))
    // Always present on a class; we can ignore
    unimplemented.delete('constructor')
    Object.values(mutations).forEach((method) => unimplemented.delete(method))
    // Names of implemented query endpoints have been mangled when converted into hooks
    unimplemented.forEach((method) => {
        const queryName = getQueryName(method)
        if (queryName in queryHooks) unimplemented.delete(method)
    })
    return [...unimplemented]
}

// Since @react-testing-library/react@14, the waitFor
// method only checks hook result by interval. Re-renders no longer
// trigger waitFor. The default interval value is 100ms and it is way
// too slow for us to assert value changes per re-render.
// See https://github.com/testing-library/react-hooks-testing-library/blob/chore/migration-guide/MIGRATION_GUIDE.md#waitfor
const WAIT_FOR_INTERVAL = 5
/** Helper type for WaitForValueToChange with hooks */
type GetHookResult<Data, Err, Vars, Ctx> = () =>
    | UseQueryResult
    | UseMutationResult<Data, Err, Vars, Ctx>
/** Helper that asserts that a hook is a success. */
export const waitAndExpectSuccess = async <Data, Err, Vars, Ctx>(
    getResult: GetHookResult<Data, Err, Vars, Ctx>
) => {
    // Checking for success first because result is still in loading state when checking for error first
    await waitFor(
        () => {
            expect(getResult().isSuccess).toBe(true)
        },
        {interval: WAIT_FOR_INTERVAL}
    )
    expect(getResult().error).toBeNull()
}
/** Helper that asserts that a hook returned an error */
export const waitAndExpectError = async <Data, Err, Vars, Ctx>(
    getResult: GetHookResult<Data, Err, Vars, Ctx>
) => {
    await waitFor(
        () => {
            expect(getResult().isError).toBe(true)
        },
        {interval: WAIT_FOR_INTERVAL}
    )
}
