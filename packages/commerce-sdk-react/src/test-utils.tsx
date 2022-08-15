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
    redirectURI: 'http://localhost:3000/callback',
    siteId: 'RefArchGlobal',
    locale: 'en_US',
    currency: 'USD',
}
const TestProviders = (props: {children: React.ReactNode}) => {
    return (
        <CommerceApiProvider
            {...sampleProps}
            queryClientConfig={{
                defaultOptions: {queries: {retry: false}, mutations: {retry: false}},
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

    const mockAuthCalls = () => {
        nock('http://localhost:3000')
            .get((uri) => {
                return uri.includes('/oauth2/authorize')
            })
            .query((q) => {
                return !!q['code_challenge']
            })
            .reply(303, undefined, {
                Location: '/callback?usid=12345&code=ABCDE',
            })
            .get('/callback?usid=12345&code=ABCDE')
            .reply(200)

        nock('http://localhost:3000')
            .post((uri) => {
                return uri.includes('/oauth2/token')
            })
            .reply(200, {
                access_token:
                    'eyJ2ZXIiOiIxLjAiLCJraWQiOiI2ZWQ2M2RmZC1iOTQzLTQ1ZjctOWMzNC01MjEyMDkwZGNjNmQiLCJ0eXAiOiJqd3QiLCJjbHYiOiJKMi4zLjQiLCJhbGciOiJFUzI1NiJ9.eyJhdXQiOiJHVUlEIiwic2NwIjoic2ZjYy5zaG9wcGVyLW15YWNjb3VudC5iYXNrZXRzIHNmY2Muc2hvcHBlci1teWFjY291bnQuYWRkcmVzc2VzIHNmY2Muc2hvcHBlci1wcm9kdWN0cyBzZmNjLnNob3BwZXItZGlzY292ZXJ5LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnJ3IHNmY2Muc2hvcHBlci1teWFjY291bnQucGF5bWVudGluc3RydW1lbnRzIHNmY2Muc2hvcHBlci1jdXN0b21lcnMubG9naW4gc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5vcmRlcnMgc2ZjYy5zaG9wcGVyLWN1c3RvbWVycy5yZWdpc3RlciBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5hZGRyZXNzZXMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wcm9kdWN0bGlzdHMucncgc2ZjYy5zaG9wcGVyLXByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItcHJvbW90aW9ucyBzZmNjLnNob3BwZXItYmFza2V0cy1vcmRlcnMucncgc2ZjYy5zaG9wcGVyLW15YWNjb3VudC5wYXltZW50aW5zdHJ1bWVudHMucncgc2ZjYy5zaG9wcGVyLWdpZnQtY2VydGlmaWNhdGVzIHNmY2Muc2hvcHBlci1wcm9kdWN0LXNlYXJjaCBzZmNjLnNob3BwZXItbXlhY2NvdW50LnByb2R1Y3RsaXN0cyBzZmNjLnNob3BwZXItY2F0ZWdvcmllcyBzZmNjLnNob3BwZXItbXlhY2NvdW50Iiwic3ViIjoiY2Mtc2xhczo6enpyZl8wMDE6OnNjaWQ6YzljNDViZmQtMGVkMy00YWEyLTk5NzEtNDBmODg5NjJiODM2Ojp1c2lkOjg1MWZkNmIwLWVmMTktNGVhYy1iNTU2LWZhMTM4Mjc3MDhlZCIsImN0eCI6InNsYXMiLCJpc3MiOiJzbGFzL3Byb2QvenpyZl8wMDEiLCJpc3QiOjEsImF1ZCI6ImNvbW1lcmNlY2xvdWQvcHJvZC96enJmXzAwMSIsIm5iZiI6MTY2MDU0MDQyMSwic3R5IjoiVXNlciIsImlzYiI6InVpZG86c2xhczo6dXBuOkd1ZXN0Ojp1aWRuOkd1ZXN0IFVzZXI6OmdjaWQ6YmNtYnNWeEtvMHdIYVJ4dXdWbXFZWXh1ZEgiLCJleHAiOjE2NjA1NDIyNTEsImlhdCI6MTY2MDU0MDQ1MSwianRpIjoiQzJDNDg1NjIwMTg2MC0xODkwNjc4OTAzMTg1MTU1MDIzMjY4NzUwMDIifQ.7Ke7GuzSYGuzVfIFdw7kzjQG53ZVAtoon0j0cxD-WitYR1xobBTEL5pKYsEV8nH-fjlS5rCP9D0nSOGVMb-b2w',
                id_token: '',
                refresh_token: 'tZpYZo4_SN91L57tvQR1p8INr8E32M0FX4-P_f7T0Lg',
                expires_in: 1800,
                token_type: 'BEARER',
                usid: '851fd6b0-ef19-4eac-b556-fa13827708ed',
                customer_id: 'bcmbsVxKo0wHaRxuwVmqYYxudH',
                enc_user_id: 'adb831a7fdd83dd1e2a309ce7591dff8',
                idp_access_token: null,
            })
    }

    const withMocks = (testFn: () => Promise<void> | void) => {
        return async () => {
            const testName = expect.getState().currentTestName
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
