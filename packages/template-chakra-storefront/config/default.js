/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// TODO: the corresponding file in the generator's assets needs to change its filename to .js to match this file.
module.exports = {
    enabled: true,
    activeDataEnabled: false,
    categoryNav: {
        defaultNavSsrDepth: 1,
        defaultRootCategory: 'root'
    },
    commerceAPI: {
        proxyPath: '/mobify/proxy/api',
        parameters: {
            clientId: '9629ef22-f8b8-4987-90ac-b815be3940c8',
            organizationId: 'f_ecom_tbbn_prd',
            shortCode: 'performance-001',
            siteId: 'SiteNemesis'
        }
    },
    mobify: {
        ssrEnabled: true,
        ssrOnly: ['ssr.js', 'ssr.js.map', 'node_modules/**/*.*'],
        ssrShared: [
            'static/favicon.ico',
            'static/robots.txt',
            '**/*.js',
            '**/*.js.map',
            '**/*.json'
        ],
        ssrParameters: {
            ssrFunctionNodeVersion: '22.x',
            proxyConfigs: [
                {
                    host: 'kv7kzm78.api.commercecloud.salesforce.com',
                    path: 'api'
                },
                {
                    host: 'zzrf-001.dx.commercecloud.salesforce.com',
                    path: 'ocapi'
                }
            ]
        }
    },
    defaultSite: 'SiteNemesis',
    defaultAppLocale: 'en-US',
    defaultSiteTitle: 'Chakra Storefront',
    pages: {
        account: {
            path: '/account',
            orderSearchParam: {limit: 10, offset: 0, sort: 'best-matches', refine: []}
        },
        cart: {
            path: '/cart'
        },
        checkout: {
            path: '/checkout',
            shippingCountryCode: [
                {value: 'CA', label: 'Canada'},
                {value: 'US', label: 'United States'}
            ]
        },
        checkoutConfirmation: {
            path: '/checkout/confirmation/:orderNo'
        },
        home: {
            path: '/',
            productLimit: 10,
            mainCategory: 'newarrivals'
        },
        login: {
            path: '/login'
        },
        registration: {
            path: '/registration'
        },
        resetPassword: {
            path: '/reset-password'
        },
        resetPasswordLanding: {
            path: '/reset-password-landing'
        },
        loginRedirect: {
            path: '/callback'
        },
        passwordlessLoginLanding: {
            path: '/passwordless-login-landing'
        },
        productDetail: {
            path: '/product/:productId'
        },
        productList: {
            path: ['/search', '/category/:categoryId'],
            imageViewType: 'large',
            selectableAttributeId: 'color',
            filterAccordionSate: 'filters-expanded-index'
        },
        socialRedirect: {
            path: '/social-redirect'
        }
    },
    defaultDnt: true,
    einsteinAPI: {
        host: 'https://api.cquotient.com',
        einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
        siteId: 'aaij-MobileFirst',
        isProduction: false
    },
    dataCloudAPI: {
        appSourceId: 'fb81edab-24c6-4b40-8684-b67334dfdf32',
        tenantId: 'mmyw8zrxhfsg09lfmzrd1zjqmg'
    },
    login: {
        passwordless: {
            enabled: false,
            callbackURI:
                process.env.PASSWORDLESS_LOGIN_CALLBACK_URI || '/passwordless-login-callback',
            landingPath: '/passwordless-login-landing'
        },
        social: {
            enabled: false,
            idps: ['google', 'apple'],
            redirectURI: process.env.SOCIAL_LOGIN_REDIRECT_URI || '/social-callback'
        },
        resetPassword: {
            callbackURI: process.env.RESET_PASSWORD_CALLBACK_URI || '/reset-password-callback',
            landingPath: '/reset-password-landing'
        }
    },
    maxCacheAge: 900,
    search: {
        defaultLimitValues: [25, 50, 100],
        defaultSearchParams: {limit: 25, offset: 0, sort: 'best-matches', refine: []},
        recentSearchKey: 'recent-search-key',
        recentSearchLimit: 5,
        recentSearchMinLength: 3
    },
    siteAliases: {SiteNemesis: ''}, // TODO: this property is not covered by the generator
    sites: [
        {
            id: 'SiteNemesis',
            l10n: {
                supportedCurrencies: ['USD'],
                defaultCurrency: 'USD',
                defaultLocale: 'en-US',
                supportedLocales: [
                    {
                        id: 'en-US',
                        preferredCurrency: 'USD'
                    }
                ]
            }
        }
    ],
    staleWhileRevalidate: 900,
    url: {
        site: 'path',
        locale: 'path',
        showDefaults: true,
        interpretPlusSignAsSpace: false
    }
}
