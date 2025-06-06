/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import React, {Fragment, useState} from 'react'

// Platform Imports
import {ApplicationExtension} from '@salesforce/pwa-kit-extension-sdk/react'
import {applyHOCs} from '@salesforce/pwa-kit-extension-sdk/react/utils'
import {
    BeforeRouteMatchParams,
    GetRoutesParams,
    RouteProps
} from '@salesforce/pwa-kit-extension-sdk/types'

// Local Imports
import {Config} from './types'
import {configureRoutes} from './utils/routes-utils'
import {withChakraUI} from './components/with-chakra-ui'
import {withCommerceSdkReact} from './components/with-commerce-sdk-react'
import {withCurrency} from './components/with-currency'
import {withLayout} from './components/with-layout'
import {withMultiSite} from './components/with-multi-site'
import {withReactIntl} from './components/with-react-intl'
import {withStorefrontPreview} from './components/with-storefront-preview'
import extensionMeta from '../extension-meta.json'

// Pages
import * as Pages from './pages'
import {DrawerMenu} from './components/drawer-menu'
// import {mockCategories} from './mocks/mock-data'
import {Button} from '@chakra-ui/react'

const mockCategories = {
    categories: [
        {
            id: 'newarrivals',
            name: 'New Arrivals',
            onlineSubCategoriesCount: 2,
            pageDescription:
                'Shop all new arrivals including women and mens clothing, jewelry, accessories, suits & more at Commerce Cloud',
            pageTitle: 'Women and Mens New Arrivals in Clothing, Jewelry, Accessories & More',
            parentCategoryId: 'root',
            parentCategoryTree: [
                {
                    id: 'newarrivals',
                    name: 'New Arrivals'
                }
            ],
            c_enableCompare: false,
            c_headerMenuBanner:
                '<img alt="New Arrivals Image" src="https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dwcb06580a/images/slot/landing/cat-landing-slotbottom-womens-clothing.jpg" width="225" />',
            c_headerMenuOrientation: 'Vertical',
            c_showInMenu: true
        },
        {
            id: 'womens',
            name: 'Womens',
            onlineSubCategoriesCount: 3,
            pageDescription:
                "Women's range. Fashionable and stylish Shoes, jackets and  all other clothing for unbeatable comfort day in, day out. Practical and fashionable styles wherever the occasion.",
            pageKeywords:
                'womens boots, womens shoes, wome sandals, womens clothing, womens apparel, womens jackets',
            pageTitle: "Women's Footwear, Outerwear, Clothing & Accessories",
            parentCategoryId: 'root',
            parentCategoryTree: [
                {
                    id: 'womens',
                    name: 'Womens'
                }
            ],
            c_enableCompare: true,
            c_headerMenuBanner:
                '<img alt="Women\'s Catalog Image" src="https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dw80e8e893/images/slot/landing/cat-landing-slotbanner-womens.jpg" width="480" />',
            c_headerMenuOrientation: 'Horizontal',
            c_showInMenu: true,
            c_slotBannerImage:
                'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dw80e8e893/images/slot/landing/cat-landing-slotbanner-womens.jpg'
        },
        {
            id: 'mens',
            name: 'Mens',
            onlineSubCategoriesCount: 2,
            pageDescription:
                "Men's range. Hard-wearing boots, jackets and clothing for unbeatable comfort day in, day out. Practical, easy-to-wear styles wherever you're headed.",
            pageKeywords: 'mens boots, mens shoes, mens clothing, mens apparel, mens jackets',
            pageTitle: "Men's Footwear, Outerwear, Clothing & Accessories",
            parentCategoryId: 'root',
            parentCategoryTree: [
                {
                    id: 'mens',
                    name: 'Mens'
                }
            ],
            c_enableCompare: true,
            c_headerMenuBanner:
                '<img alt="Men\'s Category Image" src="https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dwa6379acf/images/slot/landing/cat-landing-slotbanner-mens.jpg" width="433" />',
            c_headerMenuOrientation: 'Horizontal',
            c_showInMenu: true,
            c_slotBannerImage:
                'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dwa6379acf/images/slot/landing/cat-landing-slotbanner-mens.jpg'
        },
        {
            id: 'gift-certificates',
            name: 'Gift Certificates',
            onlineSubCategoriesCount: 0,
            parentCategoryId: 'root',
            parentCategoryTree: [
                {
                    id: 'gift-certificates',
                    name: 'Gift Certificates'
                }
            ],
            c_alternativeUrl:
                'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/en_US/giftcertpurchase',
            c_enableCompare: false,
            c_showInMenu: true
        },
        {
            id: 'top-seller',
            name: 'Top Sellers',
            onlineSubCategoriesCount: 0,
            parentCategoryId: 'root',
            parentCategoryTree: [
                {
                    id: 'top-seller',
                    name: 'Top Sellers'
                }
            ],
            c_alternativeUrl:
                'https://zzrf-001.dx.commercecloud.salesforce.com/s/RefArchGlobal/en_US/search?cgid=root&amp;srule=top-sellers',
            c_enableCompare: false,
            c_showInMenu: true
        }
    ],
    id: 'root',
    name: 'Storefront Catalog - Non-EN',
    onlineSubCategoriesCount: 5
}
// TODO: THE CODE BELOW IS ONLY USED FOR TESTING PURPOSES.
// IT WILL BE REMOVED IN THE FUTURE.

const DrawerMenuPage = () => {
    const [open, setOpen] = useState(false)
    return (
        <Fragment>
            <DrawerMenu
                isOpen={open}
                onClose={() => setOpen(false)}
                // onLogoClick={onLogoClick}
                root={mockCategories}
                itemsKey="categories"
                itemsCountKey="onlineSubCategoriesCount"
            />
            <Button onClick={() => setOpen(true)}>Open Drawer</Button>
        </Fragment>
    )
}

class ChakraStorefront extends ApplicationExtension<Config> {
    static readonly id = extensionMeta.id

    extendApp<T extends React.ComponentType<T>>(
        App: React.ComponentType<T>
    ): React.ComponentType<T> {
        // NOTE: The order of these HOCs is important!
        const requiredHOCs = [
            withLayout,
            withChakraUI,
            withCurrency,
            withReactIntl,
            withMultiSite,
            withStorefrontPreview,
            withCommerceSdkReact
        ]

        return applyHOCs(App, requiredHOCs)
    }

    getRoutes(params: GetRoutesParams): RouteProps[] {
        const config = this.getConfig()

        const extensionRoutes = [
            {
                path: '/drawer-menu',
                component: DrawerMenuPage,
                exact: true
            },
            {
                path: config.pages.Home && config.pages.Home.path,
                component: Pages.Home,
                exact: true
            },
            // {
            //     path: [
            //         config.pages.Login && config.pages.Login.path,
            //         config.login.passwordless.enabled && config.login.passwordless.landingPath
            //     ].filter(Boolean),
            //     component: Pages.Login,
            //     exact: true
            // },
            // {
            //     path: config.pages.Registration && config.pages.Registration.path,
            //     component: Pages.Registration,
            //     exact: true
            // },
            // {
            //     path: [
            //         config.pages.ResetPassword && config.pages.ResetPassword.path,
            //         config.login.resetPassword && config.login.resetPassword.landingPath
            //     ].filter(Boolean),
            //     component: Pages.ResetPassword,
            //     exact: true
            // },
            // {
            //     path: config.pages.Account && config.pages.Account.path,
            //     component: Pages.Account
            // },
            // {
            //     path: config.pages.Checkout && config.pages.Checkout.path,
            //     component: Pages.Checkout,
            //     exact: true
            // },
            // {
            //     path: config.pages.CheckoutConfirmation && config.pages.CheckoutConfirmation.path,
            //     component: Pages.CheckoutConfirmation
            // },
            // {
            //     path: config.pages.LoginRedirect && config.pages.LoginRedirect.path,
            //     component: Pages.LoginRedirect,
            //     exact: true
            // },
            // {
            //     path: config.login.social.enabled && config.login.social.redirectURI,
            //     component: Pages.SocialLoginRedirect,
            //     exact: true
            // },
            // {
            //     path: config.pages.Cart && config.pages.Cart.path,
            //     component: Pages.Cart,
            //     exact: true
            // },
            {
                path: config.pages.ProductDetail && config.pages.ProductDetail.path,
                component: Pages.ProductDetail
            },
            // {
            //     path: config.pages.ProductList && config.pages.ProductList.path,
            //     component: Pages.ProductList
            // }
            {
                path: config.pages.Checkout && config.pages.Checkout.path,
                component: Pages.Checkout,
                exact: true
            }
        ].filter((route) => route.path !== false)

        return extensionRoutes as RouteProps[]
    }

    // Called before the route with all the routes
    beforeRouteMatch({allRoutes}: BeforeRouteMatchParams): RouteProps[] {
        const config = this.getConfig()

        return configureRoutes(allRoutes, config, {
            ignoredRoutes: ['/callback']
        })
    }
}

export default ChakraStorefront
