/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import HomePage from '@salesforce/retail-react-app/app/pages/home'
import {rest} from 'msw'
import {mockProductSearch} from '@salesforce/retail-react-app/app/mocks/mock-data'

test('Home Page renders without errors', async () => {
    global.server.use(
        rest.get('*/product-search', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockProductSearch))
        })
    )
    const {getByTestId} = renderWithProviders(<HomePage />)

    expect(getByTestId('home-page')).toBeInTheDocument()
    expect(typeof HomePage.getTemplateName()).toBe('string')
})
