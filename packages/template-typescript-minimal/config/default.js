/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = {
    app: {
      extensions: [
        [
          "@salesforce/extension-chakra-storefront",
          {
            "enabled": true,
            "activeDataEnabled": false,
            "categoryNav": {
              "defaultNavSsrDepth": 1,
              "defaultRootCategory": "root"
            },
            "commerceAPI": {
              "proxyPath": "/mobify/proxy/api",
              "parameters": {
                "clientId": "c9c45bfd-0ed3-4aa2-9971-40f88962b836",
                "organizationId": "f_ecom_zzrf_001",
                "shortCode": "8o7m175y",
                "siteId": "RefArchGlobal"
              }
            },
            "defaultSite": "RefArchGlobal",
            "defaultAppLocale": "en-US",
            "defaultSiteTitle": "Retail React App",
            "einsteinAPI": {
              "host": "https://api.cquotient.com",
              "einsteinId": "1ea06c6e-c936-4324-bcf0-fada93f83bb1",
              "siteId": "aaij-MobileFirst",
              "isProduction": false
            },
            "maxCacheAge": 900,
            "pages": {
              "Account": {
                "path": "/account",
                "orderSearchParam": {
                  "limit": 10,
                  "offset": 0,
                  "sort": "best-matches",
                  "refine": []
                }
              },
              "Cart": {
                "path": "/cart"
              },
              "Checkout": {
                "path": "/checkout",
                "shippingCountryCode": [
                  {
                    "value": "CA",
                    "label": "Canada"
                  },
                  {
                    "value": "US",
                    "label": "United States"
                  }
                ]
              },
              "CheckoutConfirmation": {
                "path": "/checkout/confirmation/:orderNo"
              },
              "Home": {
                "path": "/",
                "productLimit": 10,
                "mainCategory": "newarrivals"
              },
              "Login": {
                "path": "/login"
              },
              "Registration": {
                "path": "/registration"
              },
              "ResetPassword": {
                "path": "/reset-password"
              },
              "LoginRedirect": {
                "path": "/callback"
              },
              "ProductDetail": {
                "path": "/product/:productId"
              },
              "ProductList": {
                "path": [
                  "/search",
                  "/category/:categoryId"
                ],
                "imageViewType": "large",
                "selectableAttributeId": "color",
                "filterAccordionSate": "filters-expanded-index"
              }
            },
            "search": {
              "defaultLimitValues": [
                25,
                50,
                100
              ],
              "defaultSearchParams": {
                "limit": 25,
                "offset": 0,
                "sort": "best-matches",
                "refine": []
              },
              "recentSearchKey": "recent-search-key",
              "recentSearchLimit": 5,
              "recentSearchMinLength": 3
            },
            "siteAliases": {
              "RefArch": "us",
              "RefArchGlobal": "global"
            },
            "sites": [
              {
                "id": "RefArch",
                "l10n": {
                  "supportedCurrencies": [
                    "USD"
                  ],
                  "defaultCurrency": "USD",
                  "defaultLocale": "en-US",
                  "supportedLocales": [
                    {
                      "id": "en-US",
                      "preferredCurrency": "USD"
                    },
                    {
                      "id": "en-CA",
                      "preferredCurrency": "USD"
                    }
                  ]
                }
              },
              {
                "id": "RefArchGlobal",
                "l10n": {
                  "supportedCurrencies": [
                    "GBP",
                    "EUR",
                    "CNY",
                    "JPY"
                  ],
                  "defaultCurrency": "GBP",
                  "supportedLocales": [
                    {
                      "id": "de-DE",
                      "preferredCurrency": "EUR"
                    },
                    {
                      "id": "en-GB",
                      "preferredCurrency": "GBP"
                    },
                    {
                      "id": "es-MX",
                      "preferredCurrency": "MXN"
                    },
                    {
                      "id": "fr-FR",
                      "preferredCurrency": "EUR"
                    },
                    {
                      "id": "it-IT",
                      "preferredCurrency": "EUR"
                    },
                    {
                      "id": "ja-JP",
                      "preferredCurrency": "JPY"
                    },
                    {
                      "id": "ko-KR",
                      "preferredCurrency": "KRW"
                    },
                    {
                      "id": "pt-BR",
                      "preferredCurrency": "BRL"
                    },
                    {
                      "id": "zh-CN",
                      "preferredCurrency": "CNY"
                    },
                    {
                      "id": "zh-TW",
                      "preferredCurrency": "TWD"
                    }
                  ],
                  "defaultLocale": "en-GB"
                }
              }
            ],
            "staleWhileRevalidate": 900,
            "url": {
              "site": "path",
              "locale": "path",
              "showDefaults": true,
              "interpretPlusSignAsSpace": false
            }
          }
        ],
        ["@salesforce/extension-commerce-bm-seo", {
          enabled: true,
          path: "/sample-page",
          commerceAPI: {
              proxyPath: "/mobify/proxy/api",
              parameters: {
                  clientId: "c9c45bfd-0ed3-4aa2-9971-40f88962b836",
                  organizationId: "f_ecom_zzrf_001",
                  shortCode: "8o7m175y",
                  siteId: "RefArchGlobal"
              }
          },
          commerceAPIAuth: {
              propertyNameInLocals: "commerceAPIAuth"
          },
          resourceTypeToComponentMap: {
            category: 'ProductList',
            product: 'ProductDetail',
            // TODO: what component should content be mapped to?
            content_asset: 'ProductList'
          },

      }],
      ]
    },
    ssrEnabled: true,
    ssrOnly: [
      "ssr.js",
      "ssr.js.map",
      "node_modules/**/*.*"
    ],
    ssrShared: [
      "static/favicon.ico",
      "static/robots.txt",
      "**/*.js",
      "**/*.js.map",
      "**/*.json"
    ],
    ssrParameters: {
      ssrFunctionNodeVersion: "20.x",
      proxyConfigs: [
        {
          host: "kv7kzm78.api.commercecloud.salesforce.com",
          path: "api"
        },
        {
          host: "zzrf-001.dx.commercecloud.salesforce.com",
          path: "ocapi"
        }
      ],
    }
}