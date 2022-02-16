/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import HomePage from './index'
import {mockConfig} from '../../utils/mocks/mockConfigData'

jest.mock('../../commerce-api/einstein')
jest.mock('../../utils/utils', () => {
    const original = jest.requireActual('../../utils/utils')
    return {
        ...original,
        getConfig: jest.fn(() => mockConfig),
        getUrlConfig: jest.fn(() => mockConfig.app.url)
    }
})
test('Home Page renders without errors', async () => {
    const {getByTestId} = renderWithProviders(<HomePage />)

    expect(getByTestId('home-page')).toBeInTheDocument()
    expect(typeof HomePage.getTemplateName()).toEqual('string')
})
