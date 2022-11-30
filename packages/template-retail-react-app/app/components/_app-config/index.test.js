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
import { StaticRouter } from 'react-router-dom'

import mockConfig from '../../../config/mocks/default'

describe('AppConfig', () => {
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
        const mockAPI = {}
        expect(AppConfig.restore()).toBe(undefined)
        expect(AppConfig.restore({frozen: 'any values here'})).toBe(undefined)
        expect(AppConfig.freeze()).toBe(undefined)
        expect(AppConfig.extraGetPropsArgs({api: mockAPI}).api).toEqual(mockAPI)
    })
})
