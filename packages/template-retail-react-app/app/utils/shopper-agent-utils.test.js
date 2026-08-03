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
    persistCommerceClientOpenState,
    getPersistedCommerceClientOpenState,
    resolveCommerceClientScriptUrl,
    validateCommerceClientDomain,
    validateCommerceClientAgentSettings
} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'
import {
    COMMERCE_CLIENT_CDN_BASE_URL,
    COMMERCE_CLIENT_OPEN_STATE_KEY
} from '@salesforce/retail-react-app/app/constants'

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

    describe('Commerce Client open-state persistence', () => {
        let store

        beforeEach(() => {
            store = {}
            global.window = {
                sessionStorage: {
                    getItem: jest.fn((key) => (key in store ? store[key] : null)),
                    setItem: jest.fn((key, value) => {
                        store[key] = value
                    })
                }
            }
        })

        describe('persistCommerceClientOpenState', () => {
            test('should return early if not on client side', () => {
                delete global.window

                expect(() => persistCommerceClientOpenState(true)).not.toThrow()
            })

            test('should store true when the panel is open', () => {
                persistCommerceClientOpenState(true)

                expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
                    COMMERCE_CLIENT_OPEN_STATE_KEY,
                    'true'
                )
            })

            test('should store false when the panel is closed', () => {
                persistCommerceClientOpenState(false)

                expect(store[COMMERCE_CLIENT_OPEN_STATE_KEY]).toBe('false')
            })

            test('should coerce non-boolean values to a boolean before storing', () => {
                persistCommerceClientOpenState('truthy')

                expect(store[COMMERCE_CLIENT_OPEN_STATE_KEY]).toBe('true')
            })

            test('should log and not throw when sessionStorage throws', () => {
                window.sessionStorage.setItem.mockImplementation(() => {
                    throw new Error('quota exceeded')
                })

                expect(() => persistCommerceClientOpenState(true)).not.toThrow()
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    'Shopper Agent: Error persisting Commerce Client open state',
                    expect.any(Error)
                )
            })
        })

        describe('getPersistedCommerceClientOpenState', () => {
            test('should return undefined if not on client side', () => {
                delete global.window

                expect(getPersistedCommerceClientOpenState()).toBeUndefined()
            })

            test('should return undefined when nothing has been persisted', () => {
                expect(getPersistedCommerceClientOpenState()).toBeUndefined()
            })

            test('should return true when the stored value is true', () => {
                store[COMMERCE_CLIENT_OPEN_STATE_KEY] = 'true'

                expect(getPersistedCommerceClientOpenState()).toBe(true)
            })

            test('should return false when the stored value is false', () => {
                store[COMMERCE_CLIENT_OPEN_STATE_KEY] = 'false'

                expect(getPersistedCommerceClientOpenState()).toBe(false)
            })

            test('should round-trip a value written by persistCommerceClientOpenState', () => {
                persistCommerceClientOpenState(true)

                expect(getPersistedCommerceClientOpenState()).toBe(true)
            })

            test('should log and return undefined when the stored value is malformed', () => {
                store[COMMERCE_CLIENT_OPEN_STATE_KEY] = '{not json'

                expect(getPersistedCommerceClientOpenState()).toBeUndefined()
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    'Shopper Agent: Error reading Commerce Client open state',
                    expect.any(Error)
                )
            })
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
            cc_esDeveloperName: 'My_Embedded_Service',
            cc_cdnVersion: '1.0.0'
        }

        test('returns true for a valid configuration', () => {
            expect(validateCommerceClientAgentSettings(validConfig)).toBe(true)
        })

        test('returns true when an explicit trusted script URL override is provided', () => {
            const result = validateCommerceClientAgentSettings({
                ...validConfig,
                cc_cdnVersion: undefined,
                commerceClientScriptSourceUrl:
                    'https://cdn.search.cimulate.ai/copilot-widget/1.0.0/messaging.umd.js'
            })

            expect(result).toBe(true)
        })

        test('returns true for a trusted sfcc-store-internal.net script URL override', () => {
            const result = validateCommerceClientAgentSettings({
                ...validConfig,
                cc_cdnVersion: undefined,
                commerceClientScriptSourceUrl:
                    'https://www.shop.prd.tbdp.sfcc-store-internal.net/jscript/messaging.umd.js'
            })

            expect(result).toBe(true)
        })

        test('falls back to embeddedServiceName when cc_esDeveloperName is absent', () => {
            const result = validateCommerceClientAgentSettings({
                ...validConfig,
                cc_esDeveloperName: undefined,
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
                'Invalid Commerce Client agent settings. Required: scrt2Url, salesforceOrgId, cc_esDeveloperName (or embeddedServiceName), and cc_cdnVersion (or commerceClientScriptSourceUrl).'
            )
        })

        test('returns false and logs when neither cc_cdnVersion nor commerceClientScriptSourceUrl is set', () => {
            const result = validateCommerceClientAgentSettings({
                ...validConfig,
                cc_cdnVersion: undefined
            })

            expect(result).toBe(false)
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Invalid Commerce Client agent settings. Required: scrt2Url, salesforceOrgId, cc_esDeveloperName (or embeddedServiceName), and cc_cdnVersion (or commerceClientScriptSourceUrl).'
            )
        })

        test('returns false when cc_esDeveloperName and embeddedServiceName are absent', () => {
            const result = validateCommerceClientAgentSettings({
                scrt2Url: validConfig.scrt2Url,
                salesforceOrgId: validConfig.salesforceOrgId,
                cc_cdnVersion: validConfig.cc_cdnVersion
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

        test('returns false and logs when the script URL override is from an untrusted domain', () => {
            const result = validateCommerceClientAgentSettings({
                ...validConfig,
                cc_cdnVersion: undefined,
                commerceClientScriptSourceUrl: 'https://evil.example.com/messaging.umd.js'
            })

            expect(result).toBe(false)
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Commerce Client script URL must be served from a trusted cimulate.ai or sfcc-store-internal.net domain.'
            )
        })

        describe('component overrides', () => {
            let consoleWarnSpy

            beforeEach(() => {
                consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
            })

            afterEach(() => {
                consoleWarnSpy.mockRestore()
            })

            test('warns but stays valid when cc_overrides and cc_overridesUrl are both set', () => {
                const result = validateCommerceClientAgentSettings({
                    ...validConfig,
                    cc_overridesUrl: 'https://example.com/overrides.js',
                    cc_overrides: {ProductTile: 'my-product-tile'}
                })

                expect(result).toBe(true)
                expect(consoleWarnSpy).toHaveBeenCalledWith(
                    'Commerce Client cc_overrides and cc_overridesUrl are mutually exclusive. Using cc_overrides and ignoring cc_overridesUrl.'
                )
            })

            test('does not warn when only cc_overrides is set', () => {
                const result = validateCommerceClientAgentSettings({
                    ...validConfig,
                    cc_overrides: {ProductTile: 'my-product-tile'}
                })

                expect(result).toBe(true)
                expect(consoleWarnSpy).not.toHaveBeenCalled()
            })

            test('does not warn when only an HTTPS cc_overridesUrl is set', () => {
                const result = validateCommerceClientAgentSettings({
                    ...validConfig,
                    cc_overridesUrl: 'https://example.com/overrides.js'
                })

                expect(result).toBe(true)
                expect(consoleWarnSpy).not.toHaveBeenCalled()
            })

            test('warns when a lone cc_overridesUrl does not use HTTPS', () => {
                const result = validateCommerceClientAgentSettings({
                    ...validConfig,
                    cc_overridesUrl: 'http://example.com/overrides.js'
                })

                expect(result).toBe(true)
                expect(consoleWarnSpy).toHaveBeenCalledWith(
                    'Commerce Client overrides URL must use HTTPS. Overrides will not be loaded.'
                )
            })

            test('skips the HTTPS check on a cc_overridesUrl that an inline map already displaced', () => {
                const result = validateCommerceClientAgentSettings({
                    ...validConfig,
                    cc_overridesUrl: 'http://example.com/overrides.js',
                    cc_overrides: {ProductTile: 'my-product-tile'}
                })

                expect(result).toBe(true)
                expect(consoleWarnSpy).not.toHaveBeenCalledWith(
                    'Commerce Client overrides URL must use HTTPS. Overrides will not be loaded.'
                )
            })

            test('treats an empty cc_overrides map as absent', () => {
                const result = validateCommerceClientAgentSettings({
                    ...validConfig,
                    cc_overridesUrl: 'https://example.com/overrides.js',
                    cc_overrides: {}
                })

                expect(result).toBe(true)
                expect(consoleWarnSpy).not.toHaveBeenCalled()
            })
        })
    })

    describe('resolveCommerceClientScriptUrl', () => {
        test('builds the Cimulate CDN URL from cc_cdnVersion', () => {
            expect(resolveCommerceClientScriptUrl({cc_cdnVersion: '1.18.0'})).toBe(
                `${COMMERCE_CLIENT_CDN_BASE_URL}/1.18.0/messaging.umd.js`
            )
        })

        test('trims whitespace around cc_cdnVersion', () => {
            expect(resolveCommerceClientScriptUrl({cc_cdnVersion: '  1.18.0  '})).toBe(
                `${COMMERCE_CLIENT_CDN_BASE_URL}/1.18.0/messaging.umd.js`
            )
        })

        test('prefers an explicit commerceClientScriptSourceUrl over cc_cdnVersion', () => {
            expect(
                resolveCommerceClientScriptUrl({
                    cc_cdnVersion: '1.18.0',
                    commerceClientScriptSourceUrl: 'http://localhost:5050/messaging.umd.js'
                })
            ).toBe('http://localhost:5050/messaging.umd.js')
        })

        test('returns an empty string when neither field is set', () => {
            expect(resolveCommerceClientScriptUrl({})).toBe('')
        })

        test('ignores a blank override and falls back to cc_cdnVersion', () => {
            expect(
                resolveCommerceClientScriptUrl({
                    cc_cdnVersion: '1.18.0',
                    commerceClientScriptSourceUrl: '   '
                })
            ).toBe(`${COMMERCE_CLIENT_CDN_BASE_URL}/1.18.0/messaging.umd.js`)
        })

        test('returns an empty string for a null/undefined config', () => {
            expect(resolveCommerceClientScriptUrl(null)).toBe('')
            expect(resolveCommerceClientScriptUrl(undefined)).toBe('')
        })
    })
})
