/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import routes from '@salesforce/retail-react-app/app/routes'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

// Mock getConfig to return test values
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn(() => mockConfig)
}))

describe('Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('exports a valid react-router configuration', () => {
        expect(Array.isArray(routes) || typeof routes === 'function').toBe(true)
    })

    test('adds catch-all route at the end', () => {
        const allRoutes = routes()
        const lastRoute = allRoutes.pop()
        expect(lastRoute.path).toBe('*')
    })

    describe('Dynamic routes', () => {
        describe('Reset password landing route', () => {
            test.each([
                ['path is null', null],
                ['path is empty string', '']
            ])('does not add route when %s', (_, landingPath) => {
                getConfig.mockReturnValue({
                    ...mockConfig,
                    app: {
                        ...mockConfig.app,
                        login: {
                            resetPassword: {
                                landingPath
                            }
                        }
                    }
                })

                const allRoutes = routes()
                const resetPasswordRoute = allRoutes.find(
                    (route) => route.path === '/custom-reset-password-landing'
                )

                expect(resetPasswordRoute).toBeUndefined()
            })

            test('does not add route when landingPath property is missing', () => {
                getConfig.mockReturnValue({
                    ...mockConfig,
                    app: {
                        ...mockConfig.app,
                        login: {
                            resetPassword: {}
                        }
                    }
                })

                const allRoutes = routes()
                const resetPasswordRoute = allRoutes.find(
                    (route) => route.path === '/reset-password-landing'
                )

                expect(resetPasswordRoute).toBeUndefined()
            })

            test('adds route when path is defined', () => {
                getConfig.mockReturnValue({
                    ...mockConfig,
                    app: {
                        ...mockConfig.app,
                        login: {
                            resetPassword: {
                                landingPath: '/reset-password-landing'
                            }
                        }
                    }
                })

                const allRoutes = routes()
                const resetPasswordRoute = allRoutes.find(
                    (route) => route.path === '/reset-password-landing'
                )

                expect(resetPasswordRoute).toBeDefined()
                expect(resetPasswordRoute.exact).toBe(true)
            })
        })

        describe('Passwordless login landing route', () => {
            test('does not add route when disabled', () => {
                getConfig.mockReturnValue({
                    ...mockConfig,
                    app: {
                        ...mockConfig.app,
                        login: {
                            passwordless: {
                                enabled: false,
                                landingPath: '/custom-passwordless-login-landing'
                            }
                        }
                    }
                })

                const allRoutes = routes()
                const passwordlessRoute = allRoutes.find(
                    (route) => route.path === '/custom-passwordless-login-landing'
                )

                expect(passwordlessRoute).toBeUndefined()
            })

            test.each([
                ['path is null', null],
                ['path is empty string', '']
            ])('does not add route when %s', (_, landingPath) => {
                getConfig.mockReturnValue({
                    ...mockConfig,
                    app: {
                        ...mockConfig.app,
                        login: {
                            passwordless: {
                                enabled: true,
                                landingPath
                            }
                        }
                    }
                })

                const allRoutes = routes()
                const passwordlessRoute = allRoutes.find(
                    (route) => route.path === '/custom-passwordless-login-landing'
                )

                expect(passwordlessRoute).toBeUndefined()
            })

            test('does not add route when landingPath property is missing', () => {
                getConfig.mockReturnValue({
                    ...mockConfig,
                    app: {
                        ...mockConfig.app,
                        login: {
                            passwordless: {
                                enabled: true
                            }
                        }
                    }
                })

                const allRoutes = routes()
                const passwordlessRoute = allRoutes.find(
                    (route) => route.path === '/custom-passwordless-login-landing'
                )

                expect(passwordlessRoute).toBeUndefined()
            })

            test('adds route when enabled and path is defined', () => {
                getConfig.mockReturnValue({
                    ...mockConfig,
                    app: {
                        ...mockConfig.app,
                        login: {
                            passwordless: {
                                enabled: true,
                                landingPath: '/passwordless-login-landing'
                            }
                        }
                    }
                })

                const allRoutes = routes()
                const passwordlessRoute = allRoutes.find(
                    (route) => route.path === '/passwordless-login-landing'
                )

                expect(passwordlessRoute).toBeDefined()
                expect(passwordlessRoute.exact).toBe(true)
            })
        })

        describe('Social login redirect route', () => {
            test('does not add route when disabled', () => {
                getConfig.mockReturnValue({
                    ...mockConfig,
                    app: {
                        ...mockConfig.app,
                        login: {
                            social: {
                                enabled: false,
                                redirectURI: '/custom-social-callback'
                            }
                        }
                    }
                })

                const allRoutes = routes()
                const socialRoute = allRoutes.find(
                    (route) => route.path === '/custom-social-callback'
                )

                expect(socialRoute).toBeUndefined()
            })

            test.each([
                ['redirectURI is null', null],
                ['redirectURI is empty string', '']
            ])('does not add route when %s', (_, redirectURI) => {
                getConfig.mockReturnValue({
                    ...mockConfig,
                    app: {
                        ...mockConfig.app,
                        login: {
                            social: {
                                enabled: true,
                                redirectURI
                            }
                        }
                    }
                })

                const allRoutes = routes()
                const socialRoute = allRoutes.find(
                    (route) => route.path === '/custom-social-callback'
                )

                expect(socialRoute).toBeUndefined()
            })

            test('does not add route when redirectURI property is missing', () => {
                getConfig.mockReturnValue({
                    ...mockConfig,
                    app: {
                        ...mockConfig.app,
                        login: {
                            social: {
                                enabled: true
                            }
                        }
                    }
                })

                const allRoutes = routes()
                const socialRoute = allRoutes.find(
                    (route) => route.path === '/custom-social-callback'
                )

                expect(socialRoute).toBeUndefined()
            })

            test('adds route when enabled and URI is defined', () => {
                getConfig.mockReturnValue({
                    ...mockConfig,
                    app: {
                        ...mockConfig.app,
                        login: {
                            social: {
                                enabled: true,
                                redirectURI: '/custom-social-callback'
                            }
                        }
                    }
                })

                const allRoutes = routes()
                const socialRoute = allRoutes.find(
                    (route) => route.path === '/custom-social-callback'
                )

                expect(socialRoute).toBeDefined()
                expect(socialRoute.exact).toBe(true)
            })
        })
    })
})
