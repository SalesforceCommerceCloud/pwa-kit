/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render} from '@testing-library/react'
import AppConfig from './index.jsx'

describe('AppConfig', () => {
    test('renders', () => {
        const {container} = render(<AppConfig />)
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
