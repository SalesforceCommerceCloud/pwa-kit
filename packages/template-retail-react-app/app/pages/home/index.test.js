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
import {screen, waitFor} from '@testing-library/react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
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

const storefronts = {
    'site-1': {
        brand: 'First store',
        collections: [{id: 'First-Collection', label: 'First collection'}]
    },
    'site-2': {
        brand: 'Second store',
        collections: [{id: 'Second-Collection', label: 'Second collection'}]
    }
}

test.each([
    ['site-1', 'uk', 'en-GB', 'site-2'],
    ['site-2', 'us', 'en-US', 'site-1']
])('shows only the configured collections for %s', async (siteId, siteAlias, locale, otherSite) => {
    const {app} = getConfig()
    const {commerceAgentSearch, smartSearchStorefront} = app
    app.commerceAgentSearch = {enabled: true}
    app.smartSearchStorefront = {bySite: storefronts}
    const [{id, label}] = storefronts[siteId].collections
    const [{label: otherLabel}] = storefronts[otherSite].collections
    const loadCollection = jest.fn()
    global.server.use(
        rest.get('*/product-search', (req, res, ctx) => {
            loadCollection(
                req.url.searchParams.get('siteId'),
                req.url.searchParams.getAll('refine')
            )
            return res(ctx.status(200), ctx.json(mockProductSearch))
        })
    )
    try {
        renderWithProviders(<HomePage />, {wrapperProps: {siteAlias, locale: {id: locale}}})
        const link = await screen.findByRole('link', {name: label})
        expect(link).toHaveAttribute('href', expect.stringContaining(`/category/${id}`))
        expect(screen.queryByRole('link', {name: otherLabel})).not.toBeInTheDocument()
        expect(
            screen.queryByRole('button', {name: 'Chat with the shopping agent'})
        ).not.toBeInTheDocument()
        await waitFor(() => expect(loadCollection).toHaveBeenCalledWith(siteId, [`cgid=${id}`]))
    } finally {
        app.commerceAgentSearch = commerceAgentSearch
        app.smartSearchStorefront = smartSearchStorefront
    }
})
