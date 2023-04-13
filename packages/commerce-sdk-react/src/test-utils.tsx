/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, RenderOptions} from '@testing-library/react'
import {renderHook, WaitForValueToChange} from '@testing-library/react-hooks/dom'
import {
    QueryClient,
    QueryClientProvider,
    UseMutationResult,
    UseQueryResult
} from '@tanstack/react-query'
import nock from 'nock'
import CommerceApiProvider, {CommerceApiProviderProps} from './provider'

// Note: this host does NOT exist
// it is intentional b/c we can catch those unintercepted requests
// from log easily. You should always make sure all requests are nocked.
export const DEFAULT_TEST_HOST = 'http://localhost:8888'

export const DEFAULT_TEST_CONFIG = {
    proxy: `${DEFAULT_TEST_HOST}/mobify/proxy/api`,
    redirectURI: `${DEFAULT_TEST_HOST}/callback`,
    clientId: '12345678-1234-1234-1234-123412341234',
    clientSecret: 'abc123',
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
            // Disable error logs as we intentionally cause errors during tests
            error() {} // eslint-disable-line @typescript-eslint/no-empty-function
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

/** Mocks DELETE, PATCH, POST, and PUT so we don't have to look up which verb an endpoint uses. */
export const mockMutationEndpoints = (
    matchingPath: string,
    response: string | object | undefined,
    statusCode = 200
) => {
    const matcher = (uri: string) => uri.includes(matchingPath)
    // For some reason, re-using scope (i.e. nock() and chained methods)
    // results in duplicate mocked requests, which breaks our validation
    // of # of requests used.
    nock(DEFAULT_TEST_HOST).delete(matcher).reply(statusCode, response)
    nock(DEFAULT_TEST_HOST).patch(matcher).reply(statusCode, response)
    nock(DEFAULT_TEST_HOST).put(matcher).reply(statusCode, response)
    nock(DEFAULT_TEST_HOST).post(matcher).reply(statusCode, response)
}

/** Mocks a GET request to an endpoint. */
export const mockQueryEndpoint = (
    matchingPath: string,
    response: string | object | unknown[],
    statusCode = 200
) => {
    const matcher = (uri: string) => uri.includes(matchingPath)
    return nock(DEFAULT_TEST_HOST).get(matcher).reply(statusCode, response)
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
    // Most query endpoints start with 'get'; Shopper Login retrieveCredQualityUserInfo also exists
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
 * @param mutationsEnum Enum containing mutation endpoint names
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
/** Helper type for WaitForValueToChange with hooks */
type GetHookResult<Data, Err, Vars, Ctx> = () =>
    | UseQueryResult
    | UseMutationResult<Data, Err, Vars, Ctx>
/** Helper that waits for a hook to finish loading. */
const waitForHookToFinish = async <Data, Err, Vars, Ctx>(
    wait: WaitForValueToChange,
    getResult: GetHookResult<Data, Err, Vars, Ctx>
) => {
    await wait(() => getResult().isSuccess || getResult().isError)
}
/** Helper that asserts that a hook is a success. */
export const waitAndExpectSuccess = async <Data, Err, Vars, Ctx>(
    wait: WaitForValueToChange,
    getResult: GetHookResult<Data, Err, Vars, Ctx>
) => {
    await waitForHookToFinish(wait, getResult)
    // Checking the error first gives us the best context for failing tests
    expect(getResult().error).toBeNull()
    expect(getResult().isSuccess).toBe(true)
}
/** Helper that asserts that a hook returned an error */
export const waitAndExpectError = async <Data, Err, Vars, Ctx>(
    wait: WaitForValueToChange,
    getResult: GetHookResult<Data, Err, Vars, Ctx>
) => {
    await waitForHookToFinish(wait, getResult)
    expect(getResult().isError).toBe(true)
}
