/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import React from 'react'

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

// THIS CODE IS FOR TESTING ONLY AND WILL BE REMOVED BEFORE MERGING
import {Accordion} from '@chakra-ui/react'

import NestedAccordion from './components/nested-accordion'
import Link from './components/link'

const mockCategories = {
    root: {
        categories: [
            {
                id: 'mens',
                name: 'Mens',
                categories: [
                    {
                        id: 'mens-clothing',
                        image: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dw3683d03a/images/slot/sub_banners/cat-banner-mens-clothing.jpg',
                        name: 'Clothing',
                        onlineSubCategoriesCount: 5,
                        pageDescription:
                            "Shop Men's Clothing. Relaxed, timeless classics you can rely on; from denim to corduroys and sweaters to shirts. Huge range of contemporary colours and eco-aware designs: great casualwear at Commerce Cloud.",
                        pageKeywords: 'mens outerwear, mens tops, mens bottoms',
                        pageTitle: 'Mens Clothing Including Suits, Tops, Bottoms & More',
                        parentCategoryId: 'mens',
                        parentCategoryTree: [
                            {
                                id: 'mens',
                                name: 'Mens'
                            },
                            {
                                id: 'mens-clothing',
                                name: 'Clothing'
                            }
                        ],
                        c_enableCompare: false,
                        c_showInMenu: true,
                        categories: [
                            {
                                id: 'mens-clothing-suits',
                                image: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dwa3ce5db5/images/slot/sub_banners/cat-banner-mens-suits.jpg',
                                name: 'Suits',
                                onlineSubCategoriesCount: 0,
                                pageDescription:
                                    "Shop Men's suits for business or pleasure. Enjoy from a variety of different styles and cuts at Commerce Cloud.",
                                pageTitle: 'Mens Suits for Business and Casual',
                                parentCategoryId: 'mens-clothing',
                                parentCategoryTree: [
                                    {
                                        id: 'mens',
                                        name: 'Mens'
                                    },
                                    {
                                        id: 'mens-clothing',
                                        name: 'Clothing'
                                    },
                                    {
                                        id: 'mens-clothing-suits',
                                        name: 'Suits'
                                    }
                                ],
                                c_enableCompare: false,
                                c_showInMenu: true,
                                c_slotBannerImage:
                                    'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dw5d390d95/images/slot/landing/cat-landing-slotbottom-mens-suits.jpg'
                            },
                            {
                                id: 'mens-clothing-jackets',
                                image: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dwcd7b3501/images/slot/sub_banners/cat-banner-mens-jackets.jpg',
                                name: 'Jackets & Coats',
                                onlineSubCategoriesCount: 0,
                                pageDescription:
                                    "Shop Men's Jackets, Coats & Outerwear. Classic outdoor-tested garments with traditional styling details that provide comfort, insulation and ease of movement, whatever the weather at Commerce Cloud.",
                                pageKeywords:
                                    'mens jackets, mens coats, mens leather jackets, mens waterproof jackets, mens insulated jackets, mens vests, mens water resistant jackets',
                                pageTitle: "Men's Jackets Including Jackets & Blazzers",
                                parentCategoryId: 'mens-clothing',
                                parentCategoryTree: [
                                    {
                                        id: 'mens',
                                        name: 'Mens'
                                    },
                                    {
                                        id: 'mens-clothing',
                                        name: 'Clothing'
                                    },
                                    {
                                        id: 'mens-clothing-jackets',
                                        name: 'Jackets & Coats'
                                    }
                                ],
                                c_enableCompare: false,
                                c_showInMenu: true,
                                c_sizeChartID: 'mens-clothing',
                                c_slotBannerImage:
                                    'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dwe190ede4/images/slot/landing/cat-landing-slotbottom-mens-jackets.jpg'
                            },
                            {
                                id: 'mens-clothing-dress-shirts',
                                image: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dwb1f6b8db/images/slot/sub_banners/cat-banner-mens-shirts.jpg',
                                name: 'Dress Shirts',
                                onlineSubCategoriesCount: 0,
                                pageDescription:
                                    "Shop Men's dress shirts in a variety of colors and styles including striped, button down, non-iron & more at Commerce Cloud",
                                pageTitle:
                                    "Men's Dress Shirts including Striped, Button Down, Non-Iron & More",
                                parentCategoryId: 'mens-clothing',
                                parentCategoryTree: [
                                    {
                                        id: 'mens',
                                        name: 'Mens'
                                    },
                                    {
                                        id: 'mens-clothing',
                                        name: 'Clothing'
                                    },
                                    {
                                        id: 'mens-clothing-dress-shirts',
                                        name: 'Dress Shirts'
                                    }
                                ],
                                c_enableCompare: true,
                                c_showInMenu: true,
                                c_slotBannerImage:
                                    'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dw10e86889/images/slot/landing/cat-landing-slotbottom-mens-dressshirts.jpg'
                            },
                            {
                                id: 'mens-clothing-shorts',
                                image: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dw6cc486be/images/slot/sub_banners/cat-banner-mens-shorts.jpg',
                                name: 'Shorts',
                                onlineSubCategoriesCount: 0,
                                pageDescription:
                                    "Shop Men's spring shorts in cotton. Variety of different fits at Commerce Cloud",
                                pageTitle: "Men's Spring Shorts",
                                parentCategoryId: 'mens-clothing',
                                parentCategoryTree: [
                                    {
                                        id: 'mens',
                                        name: 'Mens'
                                    },
                                    {
                                        id: 'mens-clothing',
                                        name: 'Clothing'
                                    },
                                    {
                                        id: 'mens-clothing-shorts',
                                        name: 'Shorts'
                                    }
                                ],
                                c_enableCompare: false,
                                c_showInMenu: true,
                                c_slotBannerImage:
                                    'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dw29e1f5dd/images/slot/landing/cat-landing-slotbottom-mens-shorts.jpg'
                            },
                            {
                                id: 'mens-clothing-pants',
                                image: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dwc73124cd/images/slot/sub_banners/cat-banner-mens-pants.jpg',
                                name: 'Pants',
                                onlineSubCategoriesCount: 0,
                                pageDescription:
                                    "Shop Men's Trousers. Practical, easy-to-wear styles wherever you're headed. Check out Commerce Cloud's famous rugged, long-lasting trousers, jeans, cargo pants and more at Commerce Cloud.",
                                pageKeywords:
                                    'mens pants, mens khaki pants, mens cargo pants, combat trousers, combat pants, combats, mens casual pants, mens jeans, mens denim jeans',
                                pageTitle:
                                    "Men's Pants Including Khakis, Cargos, Trousers, Jeans & More",
                                parentCategoryId: 'mens-clothing',
                                parentCategoryTree: [
                                    {
                                        id: 'mens',
                                        name: 'Mens'
                                    },
                                    {
                                        id: 'mens-clothing',
                                        name: 'Clothing'
                                    },
                                    {
                                        id: 'mens-clothing-pants',
                                        name: 'Pants'
                                    }
                                ],
                                c_enableCompare: false,
                                c_showInMenu: true,
                                c_sizeChartID: 'mens-clothing',
                                c_slotBannerImage:
                                    'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dw1a480080/images/slot/landing/cat-landing-slotbottom-mens-pants.jpg'
                            }
                        ]
                    },
                    {
                        id: 'mens-accessories',
                        image: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dwa37eb65e/images/slot/sub_banners/cat-banner-mens-accessories.jpg',
                        name: 'Accessories',
                        onlineSubCategoriesCount: 3,
                        pageDescription:
                            'Shop mens accessories including belts, wallets. gloves, hats, watches, luggage & more at Commerce Cloud.',
                        pageKeywords:
                            'mens accessories, mens belts, mens wallets, mens gloves, mens hats, sunglasses, watches, gloves, hats, scarves, luggage, travel bag, backpack, book bag, laptop bag, hiking backpack, mens socks, man socks',
                        pageTitle:
                            "Men's Accessories Belts, Wallets. Gloves, Hats, Watches, Luggage & More",
                        parentCategoryId: 'mens',
                        parentCategoryTree: [
                            {
                                id: 'mens',
                                name: 'Mens'
                            },
                            {
                                id: 'mens-accessories',
                                name: 'Accessories'
                            }
                        ],
                        c_enableCompare: false,
                        c_showInMenu: true,
                        c_slotBannerImage:
                            'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dw8c306b33/images/slot/landing/cat-landing-slotbottom-mens-accessories.jpg',
                        categories: [
                            {
                                id: 'mens-accessories-ties',
                                image: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dw3b164fd8/images/slot/sub_banners/cat-banner-mens-ties.jpg',
                                name: 'Ties',
                                onlineSubCategoriesCount: 0,
                                pageDescription:
                                    "Shop Mens's Ties for all occasions including business or casual at Commerce Cloud",
                                pageTitle: "Men's Casual and Business Ties",
                                parentCategoryId: 'mens-accessories',
                                parentCategoryTree: [
                                    {
                                        id: 'mens',
                                        name: 'Mens'
                                    },
                                    {
                                        id: 'mens-accessories',
                                        name: 'Accessories'
                                    },
                                    {
                                        id: 'mens-accessories-ties',
                                        name: 'Ties'
                                    }
                                ],
                                c_enableCompare: false,
                                c_showInMenu: true
                            },
                            {
                                id: 'mens-accessories-gloves',
                                image: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dw23da5bb4/images/slot/sub_banners/cat-banner-mens-gloves.jpg',
                                name: 'Gloves',
                                onlineSubCategoriesCount: 0,
                                pageDescription:
                                    "Shop Men'sGloves . Versatile, commuter, boot, oxford, deer and resolve gloves. All with famous long-lasting quality at Commerce Cloud.",
                                pageKeywords:
                                    'gloves, commuter gloves, boot gloves, oxford gloves, deer gloves, resolve gloves',
                                pageTitle: "Men's Gloves",
                                parentCategoryId: 'mens-accessories',
                                parentCategoryTree: [
                                    {
                                        id: 'mens',
                                        name: 'Mens'
                                    },
                                    {
                                        id: 'mens-accessories',
                                        name: 'Accessories'
                                    },
                                    {
                                        id: 'mens-accessories-gloves',
                                        name: 'Gloves'
                                    }
                                ],
                                c_enableCompare: false,
                                c_showInMenu: true
                            },
                            {
                                id: 'mens-accessories-luggage',
                                image: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-non-en/default/dw247f843c/images/slot/sub_banners/cat-banner-mens-luggage.jpg',
                                name: 'Luggage',
                                onlineSubCategoriesCount: 0,
                                pageDescription:
                                    "Shop Men's Wheeled Luggage. Versatile, rugged suitcases, baggage, holdalls and shoulder bags. All with famous long-lasting quality at Commerce Cloud.",
                                pageKeywords: 'suitcase with wheels, wheeled luggage',
                                pageTitle: "Men's Wheeled Luggage",
                                parentCategoryId: 'mens-accessories',
                                parentCategoryTree: [
                                    {
                                        id: 'mens',
                                        name: 'Mens'
                                    },
                                    {
                                        id: 'mens-accessories',
                                        name: 'Accessories'
                                    },
                                    {
                                        id: 'mens-accessories-luggage',
                                        name: 'Luggage'
                                    }
                                ],
                                c_enableCompare: false,
                                c_showInMenu: true
                            }
                        ]
                    }
                ],
                pageDescription:
                    "Men's range. Hard-wearing boots, jackets and clothing for unbeatable comfort day in, day out. Practical, easy-to-wear styles wherever you're headed.",
                pageKeywords: 'mens boots, mens shoes, mens clothing, mens apparel, mens jackets',
                pageTitle: "Men's Footwear, Outerwear, Clothing & Accessories",
                parentCategoryId: 'root',
                c_showInMenu: true,
                image: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-storefront-catalog-m-en/default/dw56b28e03/images/slot/sub_banners/cat-banner-mens-suits.jpg'
            }
        ],
        id: 'root',
        name: 'Storefront Catalog - Non-EN'
    }
}

const NestedAccordionPage = () => {
    const FONT_SIZES = ['lg', 'md', 'md', 'md']
    const FONT_WEIGHTS = ['semibold', 'semibold', 'normal', 'normal']

    return (
        <NestedAccordion
            multiple
            urlBuilder={() => '/mock-path'}
            item={mockCategories.root}
            itemsKey="categories"
            itemsFilter="c_showInMenu"
            fontSizes={FONT_SIZES}
            fontWeights={FONT_WEIGHTS}
            itemsBefore={({depth, item}) =>
                depth > 0 ? (
                    [
                        <Accordion.Item border="none" key="show-all">
                            <Accordion.ItemTrigger
                                paddingLeft={8}
                                fontSize={FONT_SIZES[depth]}
                                fontWeight={FONT_WEIGHTS[depth]}
                                as={Link}
                                to="/"
                                color="black"
                            >
                                Shop All
                            </Accordion.ItemTrigger>
                        </Accordion.Item>
                    ]
                ) : (
                    <></>
                )
            }
        />
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
                path: '/nested-accordion',
                component: NestedAccordionPage,
                exact: true
            },
            {
                path: config.pages.Home && config.pages.Home.path,
                component: Pages.Home,
                exact: true
            }
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
            // {
            //     path: config.pages.ProductDetail && config.pages.ProductDetail.path,
            //     component: Pages.ProductDetail
            // },
            // {
            //     path: config.pages.ProductList && config.pages.ProductList.path,
            //     component: Pages.ProductList
            // }
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
