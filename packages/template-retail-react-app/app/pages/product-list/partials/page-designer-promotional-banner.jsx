/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {usePage} from '@salesforce/commerce-sdk-react'
import PropTypes from 'prop-types'

// Components
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import {Page} from '@salesforce/commerce-sdk-react/components'

// Page Designer Components
import {ImageWithText} from '@salesforce/retail-react-app/app/page-designer/assets'
import {MobileGrid1r1c} from '@salesforce/retail-react-app/app/page-designer/layouts'

const PageDesignerPromotionalBanner = ({isUpdatingShopperContext}) => {
    const PROMO_BANNER_DESKTOP_PAGE_ID = 'instagram-promo-banner-desktop'
    const PROMO_BANNER_MOBILE_PAGE_ID = 'instagram-promo-banner-mobile'
    const PAGEDESIGNER_TO_COMPONENT = {
        'commerce_assets.productListTile': ImageWithText,
        'commerce_layouts.mobileGrid1r1c': MobileGrid1r1c
    }

    const {data: promoBannerDesktop, error: pageErrorDesktop, refetch: refetchDesktop} = usePage({
        parameters: {pageId: PROMO_BANNER_DESKTOP_PAGE_ID}
    })
    const {data: promoBannerMobile, error: pageErrorMobile, refetch: refetchMobile} = usePage({
        parameters: {pageId: PROMO_BANNER_MOBILE_PAGE_ID}
    })

    useEffect(() => {
        if (!isUpdatingShopperContext) {
            refetchDesktop()
            refetchMobile()
        }
        },[isUpdatingShopperContext])

    return (
        <Box>
            {promoBannerDesktop && !pageErrorDesktop && (
                <Box display={{base: 'none', md: 'block'}}>
                    <Page
                        page={promoBannerDesktop}
                        components={PAGEDESIGNER_TO_COMPONENT}
                        data-testid={'sf-promo-banner-desktop'}
                    />
                </Box>
            )}
            {promoBannerMobile && !pageErrorMobile && (
                <Box display={{base: 'block', md: 'none'}}>
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

PageDesignerPromotionalBanner.propTypes = {
    isUpdatingShopperContext: PropTypes.bool
}

export default PageDesignerPromotionalBanner
