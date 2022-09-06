/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {render, RenderOptions} from '@testing-library/react'
import nock from 'nock'
import React from 'react'
import CommerceApiProvider from './provider'

const sampleProps = {
    proxy: 'http://localhost:3000/mobify/proxy/api',
    clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
    organizationId: 'f_ecom_zzrf_001',
    shortCode: '8o7m175y',
    siteId: 'RefArchGlobal',
    locale: 'en_US',
    currency: 'USD'
}
const TestProviders = (props: {children: React.ReactNode}) => {
    return (
        <CommerceApiProvider
            {...sampleProps}
            queryClientConfig={{
                defaultOptions: {queries: {retry: false}, mutations: {retry: false}}
            }}
        >
            {props.children}
        </CommerceApiProvider>
    )
}

/**
 * Render your component, which will be wrapped with all the necessary Provider components
 *
 * @param component
 * @param options - additional options for testing-library's render function
 */
export const renderWithProviders = (
    component: React.ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
): void => {
    render(component, {wrapper: TestProviders, ...options})
}

type NockBackOptions = {
    directory: string
    mode?: nock.BackMode
}

/**
 * Enable recording and mocking of the http responses
 *
 * @param options -
 *
 * @example
 * ```
 * const {withMocks} = mockHttpResponses({directory: `${__dirname}/mock-responses`})
 * test('some hook', withMocks(() => {
 *   // your test that makes http requests
 * }))
 * ```
 */
export const mockHttpResponses = (options: NockBackOptions) => {
    const mode = (process.env.NOCK_BACK_MODE as nock.BackMode) || options.mode || 'record'

    const nockBack = nock.back
    nockBack.fixtures = options.directory

    const withMocks = (testFn: () => Promise<void> | void) => {
        return async () => {
            const testName = expect.getState().currentTestName
            const fileName = `${slugify(testName)}.json`

            nockBack.setMode(mode)
            const {nockDone} = await nockBack(fileName)
            await testFn()
            nockDone()

            // Make sure nock do not interfere with other tests that do not call `withMocks`
            nockBack.setMode('wild')
        }
    }

    return {withMocks}
}

const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
}
