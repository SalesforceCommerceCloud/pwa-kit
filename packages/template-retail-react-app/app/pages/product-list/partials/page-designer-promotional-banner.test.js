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

    test('should render mobile and desktop banner', async () => {
        renderWithProviders(<PageDesignerPromotionalBanner />)
        // NOTE: Both mobile and desktop views exist, but they're hidden
        // with display:none style depending on the browser's view
        expect(await screen.findByTestId('sf-promo-banner-desktop')).toBeInTheDocument()
        expect(await screen.findByTestId('sf-promo-banner-mobile')).toBeInTheDocument()
    })

    test.each([
        [500, mockImageWithText],
        [500, undefined]
    ])('should not render when /page API returns a 500', async (statusCode, response) => {
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
