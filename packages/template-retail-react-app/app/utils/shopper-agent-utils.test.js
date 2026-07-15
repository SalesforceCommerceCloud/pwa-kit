/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    launchChat,
    openShopperAgent,
    resetEmbeddedMessagingForCommerceSessionChange,
    openCommerceClientWidget,
    openShopperAgentWidget,
    validateCommerceClientDomain,
    validateCommerceClientAgentSettings,
    isCommerceClientStaticLoadingMode,
    resolveCommerceClientScriptUrl
} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

jest.mock('@salesforce/pwa-kit-react-sdk/ssr/universal/utils', () => ({
    getAssetUrl: jest.fn((path) => `https://storefront.example.com/mobify/bundle/development/${path}`)
}))

describe('shopper-agent-utils', () => {
    let originalWindow
    let consoleErrorSpy

    beforeEach(() => {
        // Save original window
        originalWindow = global.window
        // Mock console methods
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        // Restore console methods
        consoleErrorSpy.mockRestore()
        jest.clearAllMocks()
        // Restore window after clearing mocks
        global.window = originalWindow
    })

    describe('launchChat', () => {
        test('should return early if not on client side', () => {
            delete global.window

            const result = launchChat()

            expect(result).toBeUndefined()
        })

        test('should launch chat when embeddedservice_bootstrap is available', () => {
            const mockLaunchChat = jest.fn()

            global.window = {
                embeddedservice_bootstrap: {
                    utilAPI: {
                        launchChat: mockLaunchChat
                    }
                }
            }

            launchChat()

            expect(mockLaunchChat).toHaveBeenCalledTimes(1)
        })

        test('should not launch chat when embeddedservice_bootstrap is missing', () => {
            global.window = {}

            expect(() => launchChat()).not.toThrow()
        })

        test('should not launch chat when utilAPI is missing', () => {
            global.window = {
                embeddedservice_bootstrap: {}
            }

            expect(() => launchChat()).not.toThrow()
        })

        test('should not launch chat when launchChat is not a function', () => {
            global.window = {
                embeddedservice_bootstrap: {
                    utilAPI: {
                        launchChat: 'not a function'
                    }
                }
            }

            expect(() => launchChat()).not.toThrow()
        })

        test('should call showChatButton before launchChat when hideChatButtonOnLoad is true', () => {
            const mockShowChatButton = jest.fn()
            const mockLaunchChat = jest.fn()

            global.window = {
                embeddedservice_bootstrap: {
                    settings: {
                        hideChatButtonOnLoad: true
                    },
                    utilAPI: {
                        showChatButton: mockShowChatButton,
                        launchChat: mockLaunchChat
                    }
                }
            }

            launchChat()

            expect(mockShowChatButton).toHaveBeenCalledTimes(1)
            expect(mockLaunchChat).toHaveBeenCalledTimes(1)
            // showChatButton must be called before launchChat
            expect(mockShowChatButton.mock.invocationCallOrder[0]).toBeLessThan(
                mockLaunchChat.mock.invocationCallOrder[0]
            )
        })

        test('should not call showChatButton when hideChatButtonOnLoad is false', () => {
            const mockShowChatButton = jest.fn()
            const mockLaunchChat = jest.fn()

            global.window = {
                embeddedservice_bootstrap: {
                    settings: {
                        hideChatButtonOnLoad: false
                    },
                    utilAPI: {
                        showChatButton: mockShowChatButton,
                        launchChat: mockLaunchChat
                    }
                }
            }

            launchChat()

            expect(mockShowChatButton).not.toHaveBeenCalled()
            expect(mockLaunchChat).toHaveBeenCalledTimes(1)
        })

        test('should handle errors and log error', () => {
            const mockLaunchChat = jest.fn(() => {
                throw new Error('Launch error')
            })

            global.window = {
                embeddedservice_bootstrap: {
                    utilAPI: {
                        launchChat: mockLaunchChat
                    }
                }
            }

            launchChat()

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Shopper Agent: Error launching chat',
                expect.any(Error)
            )
        })
    })

    describe('openShopperAgent', () => {
        test('should return early if not on client side', () => {
            delete global.window

            const result = openShopperAgent()

            expect(result).toBeUndefined()
        })

        test('should call launchChat', () => {
            const mockLaunchChat = jest.fn()

            global.window = {
                embeddedservice_bootstrap: {
                    utilAPI: {
                        launchChat: mockLaunchChat
                    }
                }
            }

            openShopperAgent()

            expect(mockLaunchChat).toHaveBeenCalledTimes(1)
        })

        test('should handle errors from launchChat and log error', () => {
            global.window = {
                embeddedservice_bootstrap: {
                    utilAPI: {
                        launchChat: jest.fn(() => {
                            throw new Error('Launch error')
                        })
                    }
                }
            }

            openShopperAgent()

            // launchChat catches its own error and logs "Error launching chat"
            // Since launchChat handles the error internally, openShopperAgent's try-catch
            // doesn't catch it, so we only see the launchChat error log
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Shopper Agent: Error launching chat',
                expect.any(Error)
            )
        })

        test('should handle errors when launchChat throws and openShopperAgent catches it', () => {
            // Simulate a scenario where launchChat itself throws an error
            // that isn't caught internally (though in practice launchChat has try-catch)
            const mockLaunchChat = jest.fn(() => {
                throw new Error('Unexpected error')
            })

            global.window = {
                embeddedservice_bootstrap: {
                    utilAPI: {
                        launchChat: mockLaunchChat
                    }
                }
            }

            openShopperAgent()

            // launchChat should have been called
            expect(mockLaunchChat).toHaveBeenCalled()
            // launchChat's internal try-catch should handle the error
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Shopper Agent: Error launching chat',
                expect.any(Error)
            )
        })

        test('should handle errors when embeddedservice_bootstrap is missing', () => {
            global.window = {}

            // Should not throw, launchChat handles missing bootstrap gracefully
            expect(() => openShopperAgent()).not.toThrow()
        })
    })

    describe('resetEmbeddedMessagingForCommerceSessionChange', () => {
        test('should call userVerificationAPI.clearSession(true) when available', async () => {
            const clearSession = jest.fn().mockResolvedValue(undefined)
            global.window = {
                embeddedservice_bootstrap: {
                    userVerificationAPI: {clearSession}
                }
            }

            resetEmbeddedMessagingForCommerceSessionChange()

            await Promise.resolve()
            expect(clearSession).toHaveBeenCalledWith(true)
        })

        test('should handle clearSession rejection and log error', async () => {
            const clearSession = jest.fn().mockRejectedValue(new Error('Clear session failed'))
            global.window = {
                embeddedservice_bootstrap: {
                    userVerificationAPI: {clearSession}
                }
            }

            resetEmbeddedMessagingForCommerceSessionChange()

            await Promise.resolve()
            await Promise.resolve() // Wait for rejection to be caught

            expect(clearSession).toHaveBeenCalledWith(true)
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Shopper Agent: clearSession after Commerce auth transition failed',
                expect.any(Error)
            )
        })

        test('should no-op when clearSession is missing', () => {
            global.window = {
                embeddedservice_bootstrap: {}
            }

            expect(() => resetEmbeddedMessagingForCommerceSessionChange()).not.toThrow()
        })

        test('should no-op when userVerificationAPI is missing', () => {
            global.window = {
                embeddedservice_bootstrap: {}
            }

            expect(() => resetEmbeddedMessagingForCommerceSessionChange()).not.toThrow()
        })

        test('should return early when not on client', () => {
            delete global.window

            expect(() => resetEmbeddedMessagingForCommerceSessionChange()).not.toThrow()
        })
    })

    describe('openCommerceClientWidget', () => {
        test('should return early if not on client side', () => {
            delete global.window

            expect(openCommerceClientWidget()).toBeUndefined()
        })

        test('should show the widget by default (show defaults to true)', () => {
            const mockToggle = jest.fn()
            global.window = {
                CimulateMessaging: {
                    eventHandlers: {components: {toggleWidgetOpen: mockToggle}}
                }
            }

            openCommerceClientWidget()

            expect(mockToggle).toHaveBeenCalledTimes(1)
            expect(mockToggle).toHaveBeenCalledWith(true)
        })

        test('should hide the widget when show is false', () => {
            const mockToggle = jest.fn()
            global.window = {
                CimulateMessaging: {
                    eventHandlers: {components: {toggleWidgetOpen: mockToggle}}
                }
            }

            openCommerceClientWidget(false)

            expect(mockToggle).toHaveBeenCalledWith(false)
        })

        test('should do nothing when the Commerce Client SDK is not present', () => {
            global.window = {}

            expect(() => openCommerceClientWidget()).not.toThrow()
        })

        test('should do nothing when toggleWidgetOpen is not a function', () => {
            global.window = {
                CimulateMessaging: {
                    eventHandlers: {components: {toggleWidgetOpen: 'not a function'}}
                }
            }

            expect(() => openCommerceClientWidget()).not.toThrow()
        })

        test('should handle errors and log when toggleWidgetOpen throws', () => {
            global.window = {
                CimulateMessaging: {
                    eventHandlers: {
                        components: {
                            toggleWidgetOpen: jest.fn(() => {
                                throw new Error('toggle error')
                            })
                        }
                    }
                }
            }

            openCommerceClientWidget()

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Shopper Agent: Error toggling Commerce Client widget',
                expect.any(Error)
            )
        })
    })

    describe('openShopperAgentWidget', () => {
        test('should return early if not on client side', () => {
            delete global.window

            expect(openShopperAgentWidget()).toBeUndefined()
        })

        test('should open the Commerce Client widget when its SDK is present', () => {
            const mockToggle = jest.fn()
            const mockLaunchChat = jest.fn()
            global.window = {
                CimulateMessaging: {
                    eventHandlers: {components: {toggleWidgetOpen: mockToggle}}
                },
                embeddedservice_bootstrap: {
                    utilAPI: {launchChat: mockLaunchChat}
                }
            }

            openShopperAgentWidget()

            // Commerce Client widget is preferred and opened...
            expect(mockToggle).toHaveBeenCalledWith(true)
            // ...and the MIAW fallback is NOT used.
            expect(mockLaunchChat).not.toHaveBeenCalled()
        })

        test('should fall back to MIAW launchChat when the Commerce Client SDK is absent', () => {
            const mockLaunchChat = jest.fn()
            global.window = {
                embeddedservice_bootstrap: {
                    utilAPI: {launchChat: mockLaunchChat}
                }
            }

            openShopperAgentWidget()

            expect(mockLaunchChat).toHaveBeenCalledTimes(1)
        })

        test('should not throw when neither provider is available', () => {
            global.window = {}

            expect(() => openShopperAgentWidget()).not.toThrow()
        })
    })

    describe('validateCommerceClientDomain', () => {
        test('returns true for the exact cimulate.ai domain', () => {
            expect(validateCommerceClientDomain('https://cimulate.ai/messaging.umd.js')).toBe(true)
        })

        test('returns true for a cimulate.ai subdomain', () => {
            expect(
                validateCommerceClientDomain(
                    'https://cdn.search.cimulate.ai/copilot-widget/1.0.0/messaging.umd.js'
                )
            ).toBe(true)
        })

        test('returns true for an sfcc-store-internal.net subdomain', () => {
            expect(
                validateCommerceClientDomain(
                    'https://www.shop.prd.tbdp.sfcc-store-internal.net/jscript/messaging.umd.js'
                )
            ).toBe(true)
        })

        test('returns false for an untrusted domain', () => {
            expect(validateCommerceClientDomain('https://evil.example.com/messaging.umd.js')).toBe(
                false
            )
        })

        test('returns false for a look-alike domain', () => {
            expect(
                validateCommerceClientDomain('https://cimulate.ai.evil.com/messaging.umd.js')
            ).toBe(false)
        })

        test('returns false for an invalid URL', () => {
            expect(validateCommerceClientDomain('not-a-valid-url')).toBe(false)
        })
    })

    describe('validateCommerceClientAgentSettings', () => {
        const validConfig = {
            scrt2Url: 'https://test.salesforce-scrt.com',
            salesforceOrgId: 'test-org-id',
            esDeveloperName: 'My_Embedded_Service',
            commerceClientScriptSourceUrl:
                'https://cdn.search.cimulate.ai/copilot-widget/1.0.0/messaging.umd.js'
        }

        test('returns true for a valid configuration', () => {
            expect(validateCommerceClientAgentSettings(validConfig)).toBe(true)
        })

        test('returns true for a trusted sfcc-store-internal.net script URL', () => {
            const result = validateCommerceClientAgentSettings({
                ...validConfig,
                commerceClientScriptSourceUrl:
                    'https://www.shop.prd.tbdp.sfcc-store-internal.net/jscript/messaging.umd.js'
            })

            expect(result).toBe(true)
        })

        test('falls back to embeddedServiceName when esDeveloperName is absent', () => {
            const result = validateCommerceClientAgentSettings({
                ...validConfig,
                esDeveloperName: undefined,
                embeddedServiceName: 'Fallback_Service'
            })

            expect(result).toBe(true)
        })

        test('returns false and logs when the configuration is null', () => {
            expect(validateCommerceClientAgentSettings(null)).toBe(false)
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Commerce agent configuration must be an object.'
            )
        })

        test('returns false and logs when the configuration is not an object', () => {
            expect(validateCommerceClientAgentSettings('not-an-object')).toBe(false)
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Commerce agent configuration must be an object.'
            )
        })

        test('returns false and logs when a required field is missing', () => {
            const result = validateCommerceClientAgentSettings({...validConfig, scrt2Url: ''})

            expect(result).toBe(false)
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Invalid Commerce Client agent settings. Required: scrt2Url, salesforceOrgId, esDeveloperName (or embeddedServiceName), and commerceClientScriptSourceUrl.'
            )
        })

        test('returns false when esDeveloperName and embeddedServiceName are absent', () => {
            const result = validateCommerceClientAgentSettings({
                scrt2Url: validConfig.scrt2Url,
                salesforceOrgId: validConfig.salesforceOrgId,
                commerceClientScriptSourceUrl: validConfig.commerceClientScriptSourceUrl
            })

            expect(result).toBe(false)
        })

        test('returns false for a whitespace-only required field', () => {
            const result = validateCommerceClientAgentSettings({
                ...validConfig,
                salesforceOrgId: '   '
            })

            expect(result).toBe(false)
        })

        test('returns false and logs when the script URL is from an untrusted domain', () => {
            const result = validateCommerceClientAgentSettings({
                ...validConfig,
                commerceClientScriptSourceUrl: 'https://evil.example.com/messaging.umd.js'
            })

            expect(result).toBe(false)
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Commerce Client script URL must be served from a trusted cimulate.ai or sfcc-store-internal.net domain.'
            )
        })

        describe("with commerceClientLoadingMode 'static'", () => {
            const staticConfig = {
                commerceClientLoadingMode: 'static',
                scrt2Url: 'https://test.salesforce-scrt.com',
                salesforceOrgId: 'test-org-id',
                esDeveloperName: 'My_Embedded_Service'
            }

            test('returns true without requiring commerceClientScriptSourceUrl', () => {
                expect(validateCommerceClientAgentSettings(staticConfig)).toBe(true)
            })

            test('skips the cimulate-domain check for a same-origin bundle', () => {
                const result = validateCommerceClientAgentSettings({
                    ...staticConfig,
                    commerceClientStaticAssetPath: 'static/commerce-client/messaging.umd.js'
                })

                expect(result).toBe(true)
            })

            test('still requires the messaging fields (scrt2Url, org id, es name)', () => {
                const result = validateCommerceClientAgentSettings({
                    ...staticConfig,
                    scrt2Url: ''
                })

                expect(result).toBe(false)
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    'Invalid Commerce Client agent settings. Required: scrt2Url, salesforceOrgId, and esDeveloperName (or embeddedServiceName).'
                )
            })
        })
    })

    describe('isCommerceClientStaticLoadingMode', () => {
        test("returns false by default (cdn) when loading mode is not set", () => {
            expect(isCommerceClientStaticLoadingMode({})).toBe(false)
            expect(isCommerceClientStaticLoadingMode(undefined)).toBe(false)
        })

        test("returns false when explicitly set to 'cdn'", () => {
            expect(isCommerceClientStaticLoadingMode({commerceClientLoadingMode: 'cdn'})).toBe(false)
        })

        test("returns true when set to 'static'", () => {
            expect(isCommerceClientStaticLoadingMode({commerceClientLoadingMode: 'static'})).toBe(
                true
            )
        })
    })

    describe('resolveCommerceClientScriptUrl', () => {
        test("returns the CDN source URL as-is in 'cdn' mode", () => {
            const url = 'https://cdn.search.cimulate.ai/copilot-widget/1.0.0/messaging.umd.js'
            expect(
                resolveCommerceClientScriptUrl({commerceClientScriptSourceUrl: url})
            ).toBe(url)
        })

        test("returns empty string in 'cdn' mode when no source URL is provided", () => {
            expect(resolveCommerceClientScriptUrl({})).toBe('')
        })

        test("resolves the default static asset path via getAssetUrl in 'static' mode", () => {
            expect(resolveCommerceClientScriptUrl({commerceClientLoadingMode: 'static'})).toBe(
                'https://storefront.example.com/mobify/bundle/development/static/commerce-client/messaging.umd.js'
            )
        })

        test("resolves a custom static asset path via getAssetUrl in 'static' mode", () => {
            expect(
                resolveCommerceClientScriptUrl({
                    commerceClientLoadingMode: 'static',
                    commerceClientStaticAssetPath: 'static/custom/widget.umd.js'
                })
            ).toBe('https://storefront.example.com/mobify/bundle/development/static/custom/widget.umd.js')
        })
    })
})
