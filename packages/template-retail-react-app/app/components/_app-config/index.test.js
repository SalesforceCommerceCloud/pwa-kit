/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, waitFor} from '@testing-library/react'
import AppConfig from './index.jsx'

import {CorrelationIdProvider} from 'pwa-kit-react-sdk/ssr/universal/contexts'
import {uuidv4} from 'pwa-kit-react-sdk/utils/uuidv4.client'
import {StaticRouter} from 'react-router-dom'

import mockConfig from '../../../config/mocks/default'
import {createServer} from '../../../jest-setup'

describe('AppConfig', () => {
    createServer()
    beforeAll(() => {
        jest.spyOn(window.localStorage, 'setItem')
    })

    beforeEach(() => {
        window.localStorage.setItem.mockClear()
    })

    afterAll(() => {
        window.localStorage.setItem.mockRestore()
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
