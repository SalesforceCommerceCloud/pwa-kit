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

// THIS CODE IS FOR TESTING ONLY
import ImageGallery from './components/image-gallery'

// Pages
import * as Pages from './pages'

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
                path: '/image-gallery',
                component: () => {
                    return (
                        <div style={{width: '680px'}}>
                            <ImageGallery
                                size="md"
                                imageGroups={[
                                    {
                                        images: [
                                            {
                                                alt: 'Striped Silk Tie, , large',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa2eef352/images/large/PG.949114314S.REDSI.PZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa2eef352/images/large/PG.949114314S.REDSI.PZ.jpg',
                                                title: 'Striped Silk Tie, '
                                            },
                                            {
                                                alt: 'Striped Silk Tie, , large',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwdae2f497/images/large/PG.949114314S.REDSI.BZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwdae2f497/images/large/PG.949114314S.REDSI.BZ.jpg',
                                                title: 'Striped Silk Tie, '
                                            }
                                        ],
                                        viewType: 'large'
                                    },
                                    {
                                        images: [
                                            {
                                                alt: 'Striped Silk Tie, Red, large',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa2eef352/images/large/PG.949114314S.REDSI.PZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwa2eef352/images/large/PG.949114314S.REDSI.PZ.jpg',
                                                title: 'Striped Silk Tie, Red'
                                            },
                                            {
                                                alt: 'Striped Silk Tie, Red, large',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwdae2f497/images/large/PG.949114314S.REDSI.BZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwdae2f497/images/large/PG.949114314S.REDSI.BZ.jpg',
                                                title: 'Striped Silk Tie, Red'
                                            }
                                        ],
                                        variationAttributes: [
                                            {
                                                id: 'color',
                                                values: [
                                                    {
                                                        value: 'REDSI'
                                                    }
                                                ]
                                            }
                                        ],
                                        viewType: 'large'
                                    },
                                    {
                                        images: [
                                            {
                                                alt: 'Striped Silk Tie, Turquoise, large',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw84c296a6/images/large/PG.949114314S.TURQUSI.PZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw84c296a6/images/large/PG.949114314S.TURQUSI.PZ.jpg',
                                                title: 'Striped Silk Tie, Turquoise'
                                            },
                                            {
                                                alt: 'Striped Silk Tie, Turquoise, large',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7560d06a/images/large/PG.949114314S.TURQUSI.BZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw7560d06a/images/large/PG.949114314S.TURQUSI.BZ.jpg',
                                                title: 'Striped Silk Tie, Turquoise'
                                            }
                                        ],
                                        variationAttributes: [
                                            {
                                                id: 'color',
                                                values: [
                                                    {
                                                        value: 'TURQUSI'
                                                    }
                                                ]
                                            }
                                        ],
                                        viewType: 'large'
                                    },
                                    {
                                        images: [
                                            {
                                                alt: 'Striped Silk Tie, , medium',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2b1cd1db/images/medium/PG.949114314S.REDSI.PZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2b1cd1db/images/medium/PG.949114314S.REDSI.PZ.jpg',
                                                title: 'Striped Silk Tie, '
                                            },
                                            {
                                                alt: 'Striped Silk Tie, , medium',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6e251e85/images/medium/PG.949114314S.REDSI.BZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6e251e85/images/medium/PG.949114314S.REDSI.BZ.jpg',
                                                title: 'Striped Silk Tie, '
                                            }
                                        ],
                                        viewType: 'medium'
                                    },
                                    {
                                        images: [
                                            {
                                                alt: 'Striped Silk Tie, Red, medium',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2b1cd1db/images/medium/PG.949114314S.REDSI.PZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw2b1cd1db/images/medium/PG.949114314S.REDSI.PZ.jpg',
                                                title: 'Striped Silk Tie, Red'
                                            },
                                            {
                                                alt: 'Striped Silk Tie, Red, medium',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6e251e85/images/medium/PG.949114314S.REDSI.BZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw6e251e85/images/medium/PG.949114314S.REDSI.BZ.jpg',
                                                title: 'Striped Silk Tie, Red'
                                            }
                                        ],
                                        variationAttributes: [
                                            {
                                                id: 'color',
                                                values: [
                                                    {
                                                        value: 'REDSI'
                                                    }
                                                ]
                                            }
                                        ],
                                        viewType: 'medium'
                                    },
                                    {
                                        images: [
                                            {
                                                alt: 'Striped Silk Tie, Turquoise, medium',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe8ae0ab9/images/medium/PG.949114314S.TURQUSI.PZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe8ae0ab9/images/medium/PG.949114314S.TURQUSI.PZ.jpg',
                                                title: 'Striped Silk Tie, Turquoise'
                                            },
                                            {
                                                alt: 'Striped Silk Tie, Turquoise, medium',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw604f57e1/images/medium/PG.949114314S.TURQUSI.BZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dw604f57e1/images/medium/PG.949114314S.TURQUSI.BZ.jpg',
                                                title: 'Striped Silk Tie, Turquoise'
                                            }
                                        ],
                                        variationAttributes: [
                                            {
                                                id: 'color',
                                                values: [
                                                    {
                                                        value: 'TURQUSI'
                                                    }
                                                ]
                                            }
                                        ],
                                        viewType: 'medium'
                                    },
                                    {
                                        images: [
                                            {
                                                alt: 'Striped Silk Tie, , small',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd112a299/images/small/PG.949114314S.REDSI.PZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd112a299/images/small/PG.949114314S.REDSI.PZ.jpg',
                                                title: 'Striped Silk Tie, '
                                            },
                                            {
                                                alt: 'Striped Silk Tie, , small',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf9f7980b/images/small/PG.949114314S.REDSI.BZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf9f7980b/images/small/PG.949114314S.REDSI.BZ.jpg',
                                                title: 'Striped Silk Tie, '
                                            }
                                        ],
                                        viewType: 'small'
                                    },
                                    {
                                        images: [
                                            {
                                                alt: 'Striped Silk Tie, Red, small',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd112a299/images/small/PG.949114314S.REDSI.PZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwd112a299/images/small/PG.949114314S.REDSI.PZ.jpg',
                                                title: 'Striped Silk Tie, Red'
                                            },
                                            {
                                                alt: 'Striped Silk Tie, Red, small',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf9f7980b/images/small/PG.949114314S.REDSI.BZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf9f7980b/images/small/PG.949114314S.REDSI.BZ.jpg',
                                                title: 'Striped Silk Tie, Red'
                                            }
                                        ],
                                        variationAttributes: [
                                            {
                                                id: 'color',
                                                values: [
                                                    {
                                                        value: 'REDSI'
                                                    }
                                                ]
                                            }
                                        ],
                                        viewType: 'small'
                                    },
                                    {
                                        images: [
                                            {
                                                alt: 'Striped Silk Tie, Turquoise, small',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe325ea2b/images/small/PG.949114314S.TURQUSI.PZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwe325ea2b/images/small/PG.949114314S.TURQUSI.PZ.jpg',
                                                title: 'Striped Silk Tie, Turquoise'
                                            },
                                            {
                                                alt: 'Striped Silk Tie, Turquoise, small',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed5577a2/images/small/PG.949114314S.TURQUSI.BZ.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwed5577a2/images/small/PG.949114314S.TURQUSI.BZ.jpg',
                                                title: 'Striped Silk Tie, Turquoise'
                                            }
                                        ],
                                        variationAttributes: [
                                            {
                                                id: 'color',
                                                values: [
                                                    {
                                                        value: 'TURQUSI'
                                                    }
                                                ]
                                            }
                                        ],
                                        viewType: 'small'
                                    },
                                    {
                                        images: [
                                            {
                                                alt: 'Striped Silk Tie, Red, swatch',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf4bf2849/images/swatch/PG.949114314S.REDSI.CP.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwf4bf2849/images/swatch/PG.949114314S.REDSI.CP.jpg',
                                                title: 'Striped Silk Tie, Red'
                                            }
                                        ],
                                        variationAttributes: [
                                            {
                                                id: 'color',
                                                values: [
                                                    {
                                                        value: 'REDSI'
                                                    }
                                                ]
                                            }
                                        ],
                                        viewType: 'swatch'
                                    },
                                    {
                                        images: [
                                            {
                                                alt: 'Striped Silk Tie, Turquoise, swatch',
                                                disBaseLink:
                                                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb59ac794/images/swatch/PG.949114314S.TURQUSI.CP.jpg',
                                                link: 'https://zzrf-001.dx.commercecloud.salesforce.com/on/demandware.static/-/Sites-apparel-m-catalog/default/dwb59ac794/images/swatch/PG.949114314S.TURQUSI.CP.jpg',
                                                title: 'Striped Silk Tie, Turquoise'
                                            }
                                        ],
                                        variationAttributes: [
                                            {
                                                id: 'color',
                                                values: [
                                                    {
                                                        value: 'TURQUSI'
                                                    }
                                                ]
                                            }
                                        ],
                                        viewType: 'swatch'
                                    }
                                ]}
                                lazy={false}
                            />
                        </div>
                    )
                },
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
