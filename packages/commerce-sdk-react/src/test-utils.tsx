/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {render, RenderOptions} from '@testing-library/react'
import jwt from 'jsonwebtoken'
import nock from 'nock'
import React from 'react'
import CommerceApiProvider, {CommerceApiProviderProps} from './provider'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {url} from 'inspector'

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

    const mockAuthCalls = () => {
        nock('http://localhost:3000')
            .persist()
            .get((uri) => {
                return uri.includes('/oauth2/authorize')
            })
            .query((q) => {
                return !!q['code_challenge']
            })
            .reply(303, undefined, {
                Location: '/callback?usid=12345&code=ABCDE'
            })
            .get('/callback?usid=12345&code=ABCDE')
            .reply(200)
        nock('http://localhost:3000')
            .persist()
            .post((uri) => {
                return uri.includes('/oauth2/login')
            })
            .reply(303, undefined, {
                Location:
                    '/callback?usid=851fd6b0-ef19-4eac-b556-fa13827708ed&state=1665780553940&scope=openid%20offline_access&code=bh7WZtgxdfdC_Jyy71gl9lFbV9di21S9brt2h-lZj-w'
            })
            .get(
                '/callback?usid=851fd6b0-ef19-4eac-b556-fa13827708ed&state=1665780553940&scope=openid%20offline_access&code=bh7WZtgxdfdC_Jyy71gl9lFbV9di21S9brt2h-lZj-w'
            )
            .reply(200)
        nock('http://localhost:3000')
            .persist()
            .post((uri) => {
                return uri.includes('/oauth2/token')
            })
            .reply(200, {
                access_token: jwt.sign({exp: Math.floor(Date.now() / 1000) + 1800}, 'secret'),
                id_token: '',
                refresh_token: 'tZpYZo4_SN91L57tvQR1p8INr8E32M0FX4-P_f7T0Lg',
                expires_in: 1800,
                token_type: 'BEARER',
                usid: '851fd6b0-ef19-4eac-b556-fa13827708ed',
                customer_id: 'bcmbsVxKo0wHaRxuwVmqYYxudH',
                enc_user_id: 'adb831a7fdd83dd1e2a309ce7591dff8',
                idp_access_token: null
            })
    }

    const withMocks = (testFn: () => Promise<void> | void) => {
        return async () => {
            const testName = expect.getState().currentTestName
            if (!testName) {
                throw new Error('You forget to name the test case!')
            }
            const fileName = `${slugify(testName)}.json`

            nockBack.setMode(mode)
            const {nockDone} = await nockBack(fileName)
            mockAuthCalls()
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
