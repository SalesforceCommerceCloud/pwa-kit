/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {usePage, useUsid, useShopperContext} from '@salesforce/commerce-sdk-react'

// Components
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import {Page} from '@salesforce/commerce-sdk-react/components'

// Page Designer Components
import {ImageWithText} from '@salesforce/retail-react-app/app/page-designer/assets'
import {MobileGrid1r1c} from '@salesforce/retail-react-app/app/page-designer/layouts'

// Hooks
import {isServer} from '@salesforce/retail-react-app/app/utils/utils'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

// Constants
const PROMO_BANNER_DESKTOP_PAGE_ID = 'instagram-promo-banner-desktop'
const PROMO_BANNER_MOBILE_PAGE_ID = 'instagram-promo-banner-mobile'
const PAGEDESIGNER_TO_COMPONENT = {
    'commerce_assets.productListTile': ImageWithText,
    'commerce_layouts.mobileGrid1r1c': MobileGrid1r1c
}

const PageDesignerPromotionalBanner = () => {
    const {site} = useMultiSite()
    const {usid} = useUsid()
    const {data: shopperContext} = useShopperContext(
        {parameters: {usid, siteId: site.id}},
        {enabled: !isServer && Boolean(usid)}
    )

    const {data: promoBannerDesktop, error: pageErrorDesktop} = usePage(
        {
            parameters: {pageId: PROMO_BANNER_DESKTOP_PAGE_ID}
        },
        {
            enabled: !!shopperContext
        }
    )
    const {data: promoBannerMobile, error: pageErrorMobile} = usePage(
        {
            parameters: {pageId: PROMO_BANNER_MOBILE_PAGE_ID}
        },
        {
            enabled: !!shopperContext
        }
    )

    return (
        <Box>
            {promoBannerDesktop && !pageErrorDesktop && (
                <Box display={{base: 'none', sm: 'block'}}>
                    <Page
                        page={promoBannerDesktop}
                        components={PAGEDESIGNER_TO_COMPONENT}
                        data-testid={'sf-promo-banner-desktop'}
                    />
                </Box>
            )}
            {promoBannerMobile && !pageErrorMobile && (
                <Box display={{base: 'block', sm: 'none'}}>
                    <Page
                        page={promoBannerMobile}
                        components={PAGEDESIGNER_TO_COMPONENT}
                        data-testid={'sf-promo-banner-mobile'}
                    />
                </Box>
            )}
        </Box>
    )
}

PageDesignerPromotionalBanner.propTypes = {}

export default PageDesignerPromotionalBanner
