/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import HomePage from './index'
import {createServer} from '../../../jest-setup'
import {mockProductSearch} from '../../mocks/mock-data'

describe('Home page', function () {
    createServer([
        {
            path: '*/product-search',
            res: () => {
                return mockProductSearch
            }
        }
    ])
    test('should render without errors', async () => {
        const {getByTestId} = renderWithProviders(<HomePage />)

        expect(getByTestId('home-page')).toBeInTheDocument()
        expect(typeof HomePage.getTemplateName()).toBe('string')
    })
})
