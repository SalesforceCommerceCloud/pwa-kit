/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {configureRoutes} from '@salesforce/retail-react-app/app/utils/routes-utils'

describe('configureRoutes', function () {
    const cases = [
        {
            urlConfig: {
                site: 'path',
                locale: 'path',
                showDefaults: true
            },
            expectedRes: [
                '/uk/',
                '/uk/en-GB/',
                '/en-GB/',
                '/uk/fr/',
                '/fr/',
                '/uk/fr-FR/',
                '/fr-FR/',
                '/uk/it-IT/',
                '/it-IT/',
                '/site-1/',
                '/site-1/en-GB/',
                '/site-1/fr/',
                '/site-1/fr-FR/',
                '/site-1/it-IT/',
                '/us/',
                '/us/en-US/',
                '/en-US/',
                '/us/en-CA/',
                '/en-CA/',
                '/site-2/',
                '/site-2/en-US/',
                '/site-2/en-CA/',
                '/',
                '/uk/category/:categoryId',
                '/uk/en-GB/category/:categoryId',
                '/en-GB/category/:categoryId',
                '/uk/fr/category/:categoryId',
                '/fr/category/:categoryId',
                '/uk/fr-FR/category/:categoryId',
                '/fr-FR/category/:categoryId',
                '/uk/it-IT/category/:categoryId',
                '/it-IT/category/:categoryId',
                '/site-1/category/:categoryId',
                '/site-1/en-GB/category/:categoryId',
                '/site-1/fr/category/:categoryId',
                '/site-1/fr-FR/category/:categoryId',
                '/site-1/it-IT/category/:categoryId',
                '/us/category/:categoryId',
                '/us/en-US/category/:categoryId',
                '/en-US/category/:categoryId',
                '/us/en-CA/category/:categoryId',
                '/en-CA/category/:categoryId',
                '/site-2/category/:categoryId',
                '/site-2/en-US/category/:categoryId',
                '/site-2/en-CA/category/:categoryId',
                '/category/:categoryId'
            ]
        },
        {
            urlConfig: {
                site: 'path',
                locale: 'path',
                showDefaults: false
            },
            expectedRes: [
                '/uk/',
                '/uk/en-GB/',
                '/en-GB/',
                '/uk/fr/',
                '/fr/',
                '/uk/fr-FR/',
                '/fr-FR/',
                '/uk/it-IT/',
                '/it-IT/',
                '/site-1/',
                '/site-1/en-GB/',
                '/site-1/fr/',
                '/site-1/fr-FR/',
                '/site-1/it-IT/',
                '/us/',
                '/us/en-US/',
                '/en-US/',
                '/us/en-CA/',
                '/en-CA/',
                '/site-2/',
                '/site-2/en-US/',
                '/site-2/en-CA/',
                '/',
                '/uk/category/:categoryId',
                '/uk/en-GB/category/:categoryId',
                '/en-GB/category/:categoryId',
                '/uk/fr/category/:categoryId',
                '/fr/category/:categoryId',
                '/uk/fr-FR/category/:categoryId',
                '/fr-FR/category/:categoryId',
                '/uk/it-IT/category/:categoryId',
                '/it-IT/category/:categoryId',
                '/site-1/category/:categoryId',
                '/site-1/en-GB/category/:categoryId',
                '/site-1/fr/category/:categoryId',
                '/site-1/fr-FR/category/:categoryId',
                '/site-1/it-IT/category/:categoryId',
                '/us/category/:categoryId',
                '/us/en-US/category/:categoryId',
                '/en-US/category/:categoryId',
                '/us/en-CA/category/:categoryId',
                '/en-CA/category/:categoryId',
                '/site-2/category/:categoryId',
                '/site-2/en-US/category/:categoryId',
                '/site-2/en-CA/category/:categoryId',
                '/category/:categoryId'
            ]
        },
        {
            urlConfig: {
                site: 'query_param',
                locale: 'path',
                showDefaults: true
            },
            expectedRes: [
                '/en-GB/',
                '/fr/',
                '/fr-FR/',
                '/it-IT/',
                '/en-US/',
                '/en-CA/',
                '/',
                '/en-GB/category/:categoryId',
                '/fr/category/:categoryId',
                '/fr-FR/category/:categoryId',
                '/it-IT/category/:categoryId',
                '/en-US/category/:categoryId',
                '/en-CA/category/:categoryId',
                '/category/:categoryId'
            ]
        },
        {
            urlConfig: {
                site: 'query_param',
                locale: 'path',
                showDefaults: false
            },
            expectedRes: [
                '/en-GB/',
                '/fr/',
                '/fr-FR/',
                '/it-IT/',
                '/en-US/',
                '/en-CA/',
                '/',
                '/en-GB/category/:categoryId',
                '/fr/category/:categoryId',
                '/fr-FR/category/:categoryId',
                '/it-IT/category/:categoryId',
                '/en-US/category/:categoryId',
                '/en-CA/category/:categoryId',
                '/category/:categoryId'
            ]
        },
        {
            urlConfig: {
                site: 'path',
                locale: 'query_param',
                showDefaults: true
            },
            expectedRes: [
                '/uk/',
                '/site-1/',
                '/us/',
                '/site-2/',
                '/',
                '/uk/category/:categoryId',
                '/site-1/category/:categoryId',
                '/us/category/:categoryId',
                '/site-2/category/:categoryId',
                '/category/:categoryId'
            ]
        },
        {
            urlConfig: {
                site: 'path',
                locale: 'query_param',
                showDefaults: false
            },
            expectedRes: [
                '/uk/',
                '/site-1/',
                '/us/',
                '/site-2/',
                '/',
                '/uk/category/:categoryId',
                '/site-1/category/:categoryId',
                '/us/category/:categoryId',
                '/site-2/category/:categoryId',
                '/category/:categoryId'
            ]
        },
        {
            urlConfig: {
                site: 'query_param',
                locale: 'query_param',
                showDefaults: true
            },
            expectedRes: ['/', '/category/:categoryId']
        },
        {
            urlConfig: {
                site: 'query_param',
                locale: 'query_param',
                showDefaults: false
            },
            expectedRes: ['/', '/category/:categoryId']
        },
        {
            urlConfig: {
                site: 'path',
                locale: 'path',
                showDefaults: true
            },
            expectedRes: [
                '/uk/',
                '/uk/en-GB/',
                '/en-GB/',
                '/uk/fr/',
                '/fr/',
                '/uk/fr-FR/',
                '/fr-FR/',
                '/uk/it-IT/',
                '/it-IT/',
                '/site-1/',
                '/site-1/en-GB/',
                '/site-1/fr/',
                '/site-1/fr-FR/',
                '/site-1/it-IT/',
                '/us/',
                '/us/en-US/',
                '/en-US/',
                '/us/en-CA/',
                '/en-CA/',
                '/site-2/',
                '/site-2/en-US/',
                '/site-2/en-CA/',
                '/',
                '/category/:categoryId'
            ],
            ignoredRoutes: ['/category/:categoryId']
        }
    ]
    beforeEach(() => {
        jest.resetModules()
    })

    const CompA = () => <div>This is component A</div>
    const CompC = () => <div>This is component C</div>

    const routes = [
        {
            path: '/',
            component: CompA,
            exact: true
        },
        {
            path: '/category/:categoryId',
            component: CompC,
            exact: true
        }
    ]

    cases.forEach(({urlConfig, expectedRes, ignoredRoutes = []}) => {
        test(`Should return expected routes based on ${JSON.stringify(urlConfig)} config${
            ignoredRoutes.length ? ` and ignore routes ${ignoredRoutes.join(',')}` : ' '
        }`, () => {
            const config = {
                app: {
                    url: urlConfig
                }
            }
            const configuredRoutes = configureRoutes(routes, config, {ignoredRoutes})
            const paths = configuredRoutes.map((route) => route.path)
            expect(paths).toEqual(expectedRes)
        })
    })

    describe('fuzzyPathMatching', function () {
        // Expected patterns based on sites mock:
        // Sites: uk (alias) / site-1 (id), us (alias) / site-2 (id)
        // Locales: en-GB, fr (alias), fr-FR, it-IT (site-1), en-US, en-CA (site-2)
        const sitePattern = 'uk|site-1|us|site-2'
        const localePattern = 'en-GB|fr|fr-FR|it-IT|en-US|en-CA'

        const fuzzyCases = [
            {
                urlConfig: {
                    site: 'path',
                    locale: 'path',
                    showDefaults: true
                },
                expectedRes: [
                    `/:site(${sitePattern})/:locale(${localePattern})/`,
                    '/',
                    `/:site(${sitePattern})/:locale(${localePattern})/category/:categoryId`,
                    '/category/:categoryId'
                ]
            },
            {
                urlConfig: {
                    site: 'path',
                    locale: 'path',
                    showDefaults: false
                },
                expectedRes: [
                    `/:site(${sitePattern})/:locale(${localePattern})/`,
                    '/',
                    `/:site(${sitePattern})/:locale(${localePattern})/category/:categoryId`,
                    '/category/:categoryId'
                ]
            },
            {
                urlConfig: {
                    site: 'query_param',
                    locale: 'path',
                    showDefaults: true
                },
                expectedRes: [
                    `/:locale(${localePattern})/`,
                    '/',
                    `/:locale(${localePattern})/category/:categoryId`,
                    '/category/:categoryId'
                ]
            },
            {
                urlConfig: {
                    site: 'query_param',
                    locale: 'path',
                    showDefaults: false
                },
                expectedRes: [
                    `/:locale(${localePattern})/`,
                    '/',
                    `/:locale(${localePattern})/category/:categoryId`,
                    '/category/:categoryId'
                ]
            },
            {
                urlConfig: {
                    site: 'path',
                    locale: 'query_param',
                    showDefaults: true
                },
                expectedRes: [
                    `/:site(${sitePattern})/`,
                    '/',
                    `/:site(${sitePattern})/category/:categoryId`,
                    '/category/:categoryId'
                ]
            },
            {
                urlConfig: {
                    site: 'path',
                    locale: 'query_param',
                    showDefaults: false
                },
                expectedRes: [
                    `/:site(${sitePattern})/`,
                    '/',
                    `/:site(${sitePattern})/category/:categoryId`,
                    '/category/:categoryId'
                ]
            },
            {
                urlConfig: {
                    site: 'query_param',
                    locale: 'query_param',
                    showDefaults: true
                },
                expectedRes: ['/', '/category/:categoryId']
            },
            {
                urlConfig: {
                    site: 'query_param',
                    locale: 'query_param',
                    showDefaults: false
                },
                expectedRes: ['/', '/category/:categoryId']
            },
            {
                urlConfig: {
                    site: 'path',
                    locale: 'path',
                    showDefaults: true
                },
                expectedRes: [
                    `/:site(${sitePattern})/:locale(${localePattern})/`,
                    '/',
                    '/category/:categoryId'
                ],
                ignoredRoutes: ['/category/:categoryId']
            }
        ]

        fuzzyCases.forEach(({urlConfig, expectedRes, ignoredRoutes = []}) => {
            test(`Should return parameterized routes with fuzzyPathMatching based on ${JSON.stringify(
                urlConfig
            )} config${
                ignoredRoutes.length ? ` and ignore routes ${ignoredRoutes.join(',')}` : ''
            }`, () => {
                const config = {
                    app: {
                        url: urlConfig
                    }
                }
                const configuredRoutes = configureRoutes(routes, config, {
                    ignoredRoutes,
                    fuzzyPathMatching: true
                })
                const paths = configuredRoutes.map((route) => route.path)
                expect(paths).toEqual(expectedRes)
            })
        })

        test('Should generate significantly fewer routes with fuzzyPathMatching enabled', () => {
            const config = {
                app: {
                    url: {
                        site: 'path',
                        locale: 'path',
                        showDefaults: true
                    }
                }
            }

            const explicitRoutes = configureRoutes(routes, config, {fuzzyPathMatching: false})
            const fuzzyRoutes = configureRoutes(routes, config, {fuzzyPathMatching: true})

            // Fuzzy matching should produce significantly fewer routes
            expect(fuzzyRoutes.length).toBeLessThan(explicitRoutes.length)
            // With 2 input routes, fuzzy should produce 4 (2 parameterized + 2 fallback)
            expect(fuzzyRoutes).toHaveLength(4)
        })

        test('Should preserve route properties when using fuzzyPathMatching', () => {
            const config = {
                app: {
                    url: {
                        site: 'path',
                        locale: 'path',
                        showDefaults: true
                    }
                }
            }
            const configuredRoutes = configureRoutes(routes, config, {fuzzyPathMatching: true})

            // All routes should have the component and exact properties preserved
            configuredRoutes.forEach((route) => {
                expect(route.component).toBeDefined()
                expect(route.exact).toBe(true)
            })
        })
    })
})
