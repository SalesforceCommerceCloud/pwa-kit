/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {rest} from 'msw'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {mockImageWithText} from '@salesforce/retail-react-app/app/mocks/page-designer'
import PageDesignerPromotionalBanner from '@salesforce/retail-react-app/app/pages/product-list/partials/page-designer-promotional-banner'
import {useShopperContext} from '@salesforce/commerce-sdk-react'

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useShopperContext: jest.fn()
    }
})

describe('PageDesignerPromotionalBanner', function () {
    beforeEach(() => {
        global.server.use(
            rest.get('*/pages/instagram-promo-banner-desktop', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json(mockImageWithText))
            })
        )
        global.server.use(
            rest.get('*/pages/instagram-promo-banner-mobile', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(200), ctx.json(mockImageWithText))
            })
        )
        window.history.pushState({}, 'ProductList', '/uk/en-GB/category/mens-clothing-jackets')
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    test.each([[{}], [{sourceCode: 'instagram'}]])(
        'should render mobile and desktop banner when shopper context exists',
        async (data) => {
            useShopperContext.mockImplementation(() => {
                return {data}
            })
            renderWithProviders(<PageDesignerPromotionalBanner />)
            // NOTE: Both mobile and desktop views exist, but they're hidden
            // with display:none style depending on the browser's view
            expect(await screen.findByTestId('sf-promo-banner-desktop')).toBeInTheDocument()
            expect(await screen.findByTestId('sf-promo-banner-mobile')).toBeInTheDocument()
        }
    )

    test('should not render mobile and desktop banner when shopper context is undefined', async () => {
        useShopperContext.mockImplementation(() => {
            return {data: undefined}
        })
        renderWithProviders(<PageDesignerPromotionalBanner />)
        // NOTE: Both mobile and desktop views exist, but they're hidden
        // with display:none style depending on the browser's view
        expect(await screen.queryByTestId('sf-promo-banner-desktop')).toBeNull()
        expect(await screen.queryByTestId('sf-promo-banner-mobile')).toBeNull()
    })

    test.each([
        [500, mockImageWithText],
        [500, undefined],
        [
            404,
            {
                detail: "No visible page with ID 'instagram-promo-banner' was found in site 'RefArchGlobal'.",
                title: 'Page Not Found',
                type: 'https://api.commercecloud.salesforce.com/documentation/error/v1/errors/page-not-found'
            }
        ]
    ])('should not render when /page API returns an error', async (statusCode, response) => {
        global.server.use(
            rest.get('*/pages/instagram-promo-banner-*', (req, res, ctx) => {
                return res(ctx.delay(0), ctx.status(statusCode), ctx.json(response))
            })
        )
        renderWithProviders(<PageDesignerPromotionalBanner />)
        expect(await screen.queryByTestId('sf-promo-banner-desktop')).toBeNull()
        expect(await screen.queryByTestId('sf-promo-banner-mobile')).toBeNull()
    })
})
