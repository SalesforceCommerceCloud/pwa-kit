/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Helmet} from 'react-helmet'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import HomePage from '@salesforce/retail-react-app/app/pages/home'
import {rest} from 'msw'
import {mockProductSearch} from '@salesforce/retail-react-app/app/mocks/mock-data'

jest.mock('@salesforce/retail-react-app/app/components/image/utils', () => ({
    ...jest.requireActual('@salesforce/retail-react-app/app/components/image/utils'),
    isServer: jest.fn().mockReturnValue(true)
}))

test('Home Page renders without errors', async () => {
    global.server.use(
        rest.get('*/product-search', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockProductSearch))
        })
    )
    const {getByTestId} = renderWithProviders(<HomePage />)

    expect(getByTestId('home-page')).toBeInTheDocument()
    expect(typeof HomePage.getTemplateName()).toBe('string')

    const helmet = Helmet.peek()
    expect(helmet.linkTags).toHaveLength(1)
    expect(helmet.linkTags[0]).toStrictEqual({
        as: 'image',
        href: '/mobify/bundle/development/static/img/hero.png',
        rel: 'preload',
        fetchPriority: 'high'
    })
})
