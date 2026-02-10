/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    launchChat,
    openShopperAgent
} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

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
})
