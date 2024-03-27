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

describe('AppConfig', () => {
    let originalFetch
    beforeAll(() => {
        jest.spyOn(window.localStorage, 'setItem')
        originalFetch = global.fetch
        global.fetch = jest.fn().mockImplementation(() => mockConfig.mockFetchOCAPISessions)
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
        global.fetch.mockClear()
        global.fetch = originalFetch
    })

    test('renders', async () => {
        const locals = {
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
})
