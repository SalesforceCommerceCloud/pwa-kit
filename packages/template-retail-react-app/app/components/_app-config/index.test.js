/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render} from '@testing-library/react'
import AppConfig from './index.jsx'

import {CorrelationIdProvider} from 'pwa-kit-react-sdk/ssr/universal/contexts'
import {uuidv4} from 'pwa-kit-react-sdk/utils/uuidv4.client'
import {StaticRouter} from 'react-router-dom'

import mockConfig from '../../../config/mocks/default'
import {rest} from 'msw'
import {registerUserToken} from '../../utils/test-utils'

describe('AppConfig', () => {
    beforeEach(() => {
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
    test('renders', () => {
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
    })

    test('AppConfig static methods behave as expected', () => {
        expect(AppConfig.restore()).toBe(undefined)
        expect(AppConfig.restore({frozen: 'any values here'})).toBe(undefined)
        expect(AppConfig.freeze()).toBe(undefined)
    })
})
