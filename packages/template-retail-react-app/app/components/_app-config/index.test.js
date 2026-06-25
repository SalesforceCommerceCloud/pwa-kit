/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, waitFor} from '@testing-library/react'
import AppConfig from '@salesforce/retail-react-app/app/components/_app-config/index.jsx'

import {CorrelationIdProvider} from '@salesforce/pwa-kit-react-sdk/ssr/universal/contexts'
import {uuidv4} from '@salesforce/pwa-kit-react-sdk/utils/uuidv4.client'
import {StaticRouter} from 'react-router-dom'

import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {rest} from 'msw'
import {registerUserToken} from '@salesforce/retail-react-app/app/utils/test-utils'

jest.mock('@salesforce/pwa-kit-react-sdk/ssr/universal/hooks', () => {
    const original = jest.requireActual('@salesforce/pwa-kit-react-sdk/ssr/universal/hooks')
    return {
        ...original,
        useOrigin: jest.fn(() => 'https://www.example.com')
    }
})

// Optional capture hook for CommerceApiProvider props. Defaults to the real provider;
// a test sets `mockCaptureProviderProps` to intercept the props without the auth stack.
let mockCaptureProviderProps = null
jest.mock('@salesforce/commerce-sdk-react', () => {
    const actual = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...actual,
        CommerceApiProvider: (props) => {
            if (mockCaptureProviderProps) {
                mockCaptureProviderProps(props)
                return props.children || null
            }
            return actual.CommerceApiProvider(props)
        }
    }
})

describe('AppConfig', () => {
    let originalFetch
    beforeAll(() => {
        jest.spyOn(window.localStorage, 'setItem')
        originalFetch = global.fetch
    })

    beforeEach(() => {
        window.localStorage.setItem.mockClear()

        global.server.use(
            rest.post('*/oauth2/token', (req, res, ctx) =>
                res(
                    ctx.delay(0),
                    ctx.json({
                        customer_id: 'customerid',
                        access_token: registerUserToken,
                        refresh_token: 'testrefeshtoken',
                        usid: 'testusid',
                        enc_user_id: 'testEncUserId',
                        id_token: 'testIdToken'
                    })
                )
            )
        )
    })

    afterAll(() => {
        window.localStorage.setItem.mockRestore()
        global.fetch = originalFetch
    })

    test('renders', async () => {
        const locals = {
            site: mockConfig.app.sites[0],
            appConfig: mockConfig.app
        }
        const {container} = render(
            <StaticRouter>
                <CorrelationIdProvider correlationId={() => uuidv4()}>
                    <AppConfig locals={locals} />
                </CorrelationIdProvider>
            </StaticRouter>
        )
        expect(container).toBeDefined()

        // Wait for access token to be saved
        // Otherwise, the test would end prematurely before our component has finished its business
        // (for example: commerce-sdk-react Provider needs to finish its useEffect for `auth.ready()`)
        await waitFor(() => {
            expect(window.localStorage.setItem).toHaveBeenCalled()
        })
    })

    test('AppConfig static methods behave as expected', () => {
        expect(AppConfig.restore()).toBeUndefined()
        expect(AppConfig.restore({frozen: 'any values here'})).toBeUndefined()
        expect(AppConfig.freeze()).toBeUndefined()
    })

    test('forwards locals.traceparent (a plain string) to CommerceApiProvider headers', () => {
        // Capture the props handed to CommerceApiProvider without standing up the
        // full provider/auth stack (the module-level mock swaps in a passthrough
        // when mockCaptureProviderProps is set). The SDK sets locals.traceparent
        // server-side; the template forwards it as a plain string header.
        let captured
        mockCaptureProviderProps = (props) => {
            captured = props
        }
        try {
            const locals = {
                site: mockConfig.app.sites[0],
                appConfig: mockConfig.app,
                traceparent: '00-abc123-def456-01'
            }
            render(
                <StaticRouter>
                    <CorrelationIdProvider correlationId={() => uuidv4()}>
                        <AppConfig locals={locals} />
                    </CorrelationIdProvider>
                </StaticRouter>
            )

            expect(captured.headers.traceparent).toBe('00-abc123-def456-01')
        } finally {
            mockCaptureProviderProps = null
        }
    })

    test('omits traceparent when locals.traceparent is absent', () => {
        let captured
        mockCaptureProviderProps = (props) => {
            captured = props
        }
        try {
            const locals = {site: mockConfig.app.sites[0], appConfig: mockConfig.app}
            render(
                <StaticRouter>
                    <CorrelationIdProvider correlationId={() => uuidv4()}>
                        <AppConfig locals={locals} />
                    </CorrelationIdProvider>
                </StaticRouter>
            )

            expect(captured.headers.traceparent).toBeUndefined()
        } finally {
            mockCaptureProviderProps = null
        }
    })
})
