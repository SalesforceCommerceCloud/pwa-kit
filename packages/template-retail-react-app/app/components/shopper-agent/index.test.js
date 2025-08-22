/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {act} from 'react-dom/test-utils'
import ShopperAgent from '@salesforce/retail-react-app/app/components/shopper-agent/index'

// Mock the embedded messaging service
const mockEmbeddedService = {
    prechatAPI: {
        setHiddenPrechatFields: jest.fn()
    },
    utilAPI: {
        sendTextMessage: jest.fn().mockResolvedValue(undefined)
    }
}

// Mock window.embeddedservice_bootstrap
Object.defineProperty(window, 'embeddedservice_bootstrap', {
    value: mockEmbeddedService,
    writable: true
})

// Mock the useScript hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-script', () => ({
    __esModule: true,
    default: jest.fn()
}))

// Mock the useMiaw hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-miaw', () => ({
    __esModule: true,
    default: jest.fn()
}))

// Mock the useRefreshToken hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-refresh-token', () => ({
    __esModule: true,
    default: jest.fn()
}))

// Mock the useUsid hook
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useUsid: jest.fn()
}))

// Mock the useMultiSite hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-multi-site', () => ({
    __esModule: true,
    default: jest.fn()
}))

// Mock the useTheme hook
jest.mock('@salesforce/retail-react-app/app/components/shared/ui', () => ({
    useTheme: jest.fn()
}))

// Import mocked hooks
import useScript from '@salesforce/retail-react-app/app/hooks/use-script'
import useMiaw from '@salesforce/retail-react-app/app/hooks/use-miaw'
import {useUsid} from '@salesforce/commerce-sdk-react'
import useRefreshToken from '@salesforce/retail-react-app/app/hooks/use-refresh-token'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {useTheme} from '@salesforce/retail-react-app/app/components/shared/ui'

// Get mocked functions
const mockedUseScript = useScript
const mockedUseMiaw = useMiaw
const mockedUseUsid = useUsid
const mockedUseRefreshToken = useRefreshToken
const mockedUseMultiSite = useMultiSite
const mockedUseTheme = useTheme

const commerceAgentSettings = {
    enabled: 'true',
    askAgentOnSearch: 'true',
    embeddedServiceName: 'test-service',
    embeddedServiceEndpoint: 'https://test.salesforce.com',
    scriptSourceUrl: 'https://test.salesforce.com/script.js',
    scrt2Url: 'https://test.salesforce.com/scrt2.js',
    salesforceOrgId: 'test-org-id',
    commerceOrgId: 'test-commerce-org-id',
    siteId: 'RefArchGlobal'
}

const defaultProps = {
    commerceAgentConfiguration: commerceAgentSettings,
    basketDoneLoading: true
}

describe('ShopperAgent Component', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks()

        // Mock useScript hook
        mockedUseScript.mockReturnValue({loaded: true, error: false})

        // Mock useMiaw hook
        mockedUseMiaw.mockReturnValue(undefined)

        // Mock useRefreshToken hook
        mockedUseRefreshToken.mockReturnValue('test-refresh-token')

        // Mock useUsid hook
        mockedUseUsid.mockReturnValue({usid: 'test-usid'})

        // Mock useMultiSite hook with proper structure
        mockedUseMultiSite.mockReturnValue({
            locale: {id: 'en-US', preferredCurrency: 'USD'}
        })

        // Mock useTheme hook
        mockedUseTheme.mockReturnValue({
            zIndices: {
                sticky: 1100
            }
        })

        // Clear any existing scripts
        delete global.window.embeddedservice_bootstrap
    })

    afterEach(() => {
        // Clean up
        delete global.window.embeddedservice_bootstrap
    })

    test('should render nothing when enabled is false', () => {
        const props = {
            ...defaultProps,
            commerceAgentConfiguration: {
                ...commerceAgentSettings,
                enabled: 'false'
            }
        }

        render(<ShopperAgent {...props} />)
        expect(screen.queryByTestId('shopper-agent')).toBeNull()
    })

    test('should render nothing when basket is not done loading', () => {
        const props = {
            ...defaultProps,
            basketDoneLoading: false
        }

        render(<ShopperAgent {...props} />)
        expect(screen.queryByTestId('shopper-agent')).toBeNull()
    })

    test('should render nothing when commerce agent settings are invalid', () => {
        const props = {
            ...defaultProps,
            commerceAgentConfiguration: {
                ...commerceAgentSettings,
                enabled: 'true',
                embeddedServiceName: '' // Invalid: empty string
            }
        }

        render(<ShopperAgent {...props} />)
        expect(screen.queryByTestId('shopper-agent')).toBeNull()
    })

    test('should render ShopperAgentWindow when all conditions are met', () => {
        render(<ShopperAgent {...defaultProps} />)

        // Component should render (even though it returns null, it should not throw)
        expect(() => render(<ShopperAgent {...defaultProps} />)).not.toThrow()
    })

    test('should set up prechat fields when embedded messaging is ready', async () => {
        render(<ShopperAgent {...defaultProps} />)

        // Trigger the onEmbeddedMessagingReady event
        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingReady'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            SiteId: 'RefArchGlobal',
            Locale: 'en-US',
            OrganizationId: 'test-commerce-org-id',
            UsId: 'test-usid',
            IsCartMgmtSupported: 'true',
            RefreshToken: 'test-refresh-token',
            Currency: 'USD'
        })
    })

    test('should update prechat fields when refresh token changes', async () => {
        // Initial refresh token
        mockedUseRefreshToken.mockReturnValue('initial-token')

        render(<ShopperAgent {...defaultProps} />)

        // Trigger prechat fields setup
        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingReady'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            SiteId: 'RefArchGlobal',
            Locale: 'en-US',
            OrganizationId: 'test-commerce-org-id',
            UsId: 'test-usid',
            IsCartMgmtSupported: 'true',
            RefreshToken: 'initial-token',
            Currency: 'USD'
        })

        // Clear mock and change refresh token
        mockEmbeddedService.prechatAPI.setHiddenPrechatFields.mockClear()
        mockedUseRefreshToken.mockReturnValue('updated-token')

        // Re-render with new refresh token
        render(<ShopperAgent {...defaultProps} />)

        // Trigger prechat fields setup again
        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingReady'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            SiteId: 'RefArchGlobal',
            Locale: 'en-US',
            OrganizationId: 'test-commerce-org-id',
            UsId: 'test-usid',
            IsCartMgmtSupported: 'true',
            RefreshToken: 'updated-token',
            Currency: 'USD'
        })
    })

    test('should handle null refresh token in prechat fields', async () => {
        mockedUseRefreshToken.mockReturnValue(null)

        render(<ShopperAgent {...defaultProps} />)

        // Trigger prechat fields setup
        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingReady'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            SiteId: 'RefArchGlobal',
            Locale: 'en-US',
            OrganizationId: 'test-commerce-org-id',
            UsId: 'test-usid',
            IsCartMgmtSupported: 'true',
            RefreshToken: null,
            Currency: 'USD'
        })
    })

    test('should update prechat fields when currency changes', async () => {
        // Mock useMultiSite to return different currency values
        mockedUseMultiSite.mockReturnValue({
            locale: {id: 'en-US', preferredCurrency: 'USD'}
        })

        render(<ShopperAgent {...defaultProps} />)

        // First render with USD
        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingReady'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            SiteId: 'RefArchGlobal',
            Locale: 'en-US',
            OrganizationId: 'test-commerce-org-id',
            UsId: 'test-usid',
            IsCartMgmtSupported: 'true',
            RefreshToken: 'test-refresh-token',
            Currency: 'USD'
        })

        // Clear mock and change currency to EUR
        mockEmbeddedService.prechatAPI.setHiddenPrechatFields.mockClear()
        mockedUseMultiSite.mockReturnValue({
            locale: {id: 'en-US', preferredCurrency: 'EUR'}
        })

        // Re-render with new currency
        render(<ShopperAgent {...defaultProps} />)

        // Trigger prechat fields setup again
        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingReady'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            SiteId: 'RefArchGlobal',
            Locale: 'en-US',
            OrganizationId: 'test-commerce-org-id',
            UsId: 'test-usid',
            IsCartMgmtSupported: 'true',
            RefreshToken: 'test-refresh-token',
            Currency: 'EUR'
        })
    })

    test('should update prechat fields when locale changes', async () => {
        // Mock useMultiSite to return different locale values
        mockedUseMultiSite.mockReturnValue({
            locale: {id: 'en-US', preferredCurrency: 'USD'}
        })

        render(<ShopperAgent {...defaultProps} />)

        // First render with en-US
        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingReady'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            SiteId: 'RefArchGlobal',
            Locale: 'en-US',
            OrganizationId: 'test-commerce-org-id',
            UsId: 'test-usid',
            IsCartMgmtSupported: 'true',
            RefreshToken: 'test-refresh-token',
            Currency: 'USD'
        })

        // Clear mock and change locale to en-GB
        mockEmbeddedService.prechatAPI.setHiddenPrechatFields.mockClear()
        mockedUseMultiSite.mockReturnValue({
            locale: {id: 'en-GB', preferredCurrency: 'GBP'}
        })

        // Re-render with new locale
        render(<ShopperAgent {...defaultProps} />)

        // Trigger prechat fields setup again
        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingReady'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            SiteId: 'RefArchGlobal',
            Locale: 'en-GB',
            OrganizationId: 'test-commerce-org-id',
            UsId: 'test-usid',
            IsCartMgmtSupported: 'true',
            RefreshToken: 'test-refresh-token',
            Currency: 'GBP'
        })
    })

    test('should update prechat fields when commerce agent configuration changes', async () => {
        const newCommerceAgentSettings = {
            ...commerceAgentSettings,
            commerceOrgId: 'new-commerce-org-id'
        }

        const props = {
            ...defaultProps,
            commerceAgentConfiguration: newCommerceAgentSettings
        }

        render(<ShopperAgent {...props} />)

        // Trigger prechat fields setup
        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingReady'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            SiteId: 'RefArchGlobal',
            Locale: 'en-US',
            OrganizationId: 'new-commerce-org-id',
            UsId: 'test-usid',
            IsCartMgmtSupported: 'true',
            RefreshToken: 'test-refresh-token',
            Currency: 'USD'
        })
    })

    test('should handle embedded messaging window maximized event', async () => {
        render(<ShopperAgent {...defaultProps} />)

        // Mock the DOM query selector
        const mockIframe = document.createElement('iframe')
        mockIframe.style.zIndex = '1000'

        // Mock the querySelector to return our mock iframe
        const mockQuerySelector = jest.spyOn(document.body, 'querySelector')
        mockQuerySelector.mockReturnValue(mockIframe)

        // Trigger the onEmbeddedMessagingWindowMaximized event
        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingWindowMaximized'))
        })

        // Verify that the z-index was updated
        expect(mockIframe.style.zIndex).toBe('1101') // 1100 + 1

        // Clean up
        mockQuerySelector.mockRestore()
    })

    test('should clean up event listeners on unmount', () => {
        const {unmount} = render(<ShopperAgent {...defaultProps} />)

        // Spy on removeEventListener
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

        // Unmount the component
        unmount()

        // Verify that event listeners were removed
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
            'onEmbeddedMessagingReady',
            expect.any(Function)
        )
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
            'onEmbeddedMessagingWindowMaximized',
            expect.any(Function)
        )

        // Clean up
        removeEventListenerSpy.mockRestore()
    })

    test('should call useMiaw with correct parameters', () => {
        render(<ShopperAgent {...defaultProps} />)

        expect(mockedUseMiaw).toHaveBeenCalledWith(
            {loaded: true, error: false}, // scriptLoadStatus
            'test-org-id', // salesforceOrgId
            'test-service', // embeddedServiceName
            'https://test.salesforce.com', // embeddedServiceEndpoint
            'https://test.salesforce.com/scrt2.js', // scrt2Url
            'en-US', // locale.id
            'test-refresh-token', // refreshToken
            'USD' // locale.preferredCurrency
        )
    })

    test('should call useScript with correct URL', () => {
        render(<ShopperAgent {...defaultProps} />)

        expect(mockedUseScript).toHaveBeenCalledWith('https://test.salesforce.com/script.js')
    })

    // New tests for conversation management functionality
    describe('Conversation Management and Utterance Functionality', () => {
        beforeEach(() => {
            // Reset the mock for sendTextMessage before each test
            mockEmbeddedService.utilAPI.sendTextMessage.mockClear()
            
            // Ensure the mock is properly set up for each test
            Object.defineProperty(window, 'embeddedservice_bootstrap', {
                value: mockEmbeddedService,
                writable: true
            })
        })

        test('should NOT send utterance immediately when conversation starts', async () => {
            render(<ShopperAgent {...defaultProps} />)

            // Trigger conversation started event
            await act(async () => {
                window.dispatchEvent(new Event('onEmbeddedMessagingConversationStarted'))
            })

            // Wait for the setTimeout to execute
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 600))
            })

            // Verify that sendTextMessage was NOT called immediately
            expect(mockEmbeddedService.utilAPI.sendTextMessage).not.toHaveBeenCalled()
        })

        test('should send utterance only after welcome message from agent', async () => {
            render(<ShopperAgent {...defaultProps} />)

            // First, trigger conversation started (should NOT send utterance)
            await act(async () => {
                window.dispatchEvent(new Event('onEmbeddedMessagingConversationStarted'))
            })

            // Verify no utterance sent yet
            expect(mockEmbeddedService.utilAPI.sendTextMessage).not.toHaveBeenCalled()

            // Now simulate the welcome message from the agent
            const welcomeMessageEvent = new CustomEvent('onEmbeddedMessageSent', {
                detail: {
                    conversationEntry: {
                        sender: {
                            role: 'Chatbot'
                        }
                    }
                }
            })

            await act(async () => {
                window.dispatchEvent(welcomeMessageEvent)
            })

            // Wait for the setTimeout to execute
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 600))
            })

            // Verify utterance was sent after welcome message
            expect(mockEmbeddedService.utilAPI.sendTextMessage).toHaveBeenCalledWith('get me access token')
        })

        test('should send utterance only once per conversation', async () => {
            render(<ShopperAgent {...defaultProps} />)

            // Start conversation
            await act(async () => {
                window.dispatchEvent(new Event('onEmbeddedMessagingConversationStarted'))
            })

            // Send welcome message
            const welcomeMessageEvent = new CustomEvent('onEmbeddedMessageSent', {
                detail: {
                    conversationEntry: {
                        sender: {
                            role: 'Chatbot'
                        }
                    }
                }
            })

            await act(async () => {
                window.dispatchEvent(welcomeMessageEvent)
            })

            // Wait for utterance to be sent
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 600))
            })

            // Verify utterance was sent once
            expect(mockEmbeddedService.utilAPI.sendTextMessage).toHaveBeenCalledTimes(1)
            expect(mockEmbeddedService.utilAPI.sendTextMessage).toHaveBeenCalledWith('get me access token')

            // Clear mock
            mockEmbeddedService.utilAPI.sendTextMessage.mockClear()

            // Try to send another welcome message (should not send utterance again)
            await act(async () => {
                window.dispatchEvent(welcomeMessageEvent)
            })

            // Wait for the setTimeout to execute
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 600))
            })

            // Verify no additional utterance was sent
            expect(mockEmbeddedService.utilAPI.sendTextMessage).not.toHaveBeenCalled()
        })

        test('should reset conversation state when conversation ends', async () => {
            render(<ShopperAgent {...defaultProps} />)

            // First conversation start and welcome message
            await act(async () => {
                window.dispatchEvent(new Event('onEmbeddedMessagingConversationStarted'))
            })

            const welcomeMessageEvent = new CustomEvent('onEmbeddedMessageSent', {
                detail: {
                    conversationEntry: {
                        sender: {
                            role: 'Chatbot'
                        }
                    }
                }
            })

            await act(async () => {
                window.dispatchEvent(welcomeMessageEvent)
            })

            // Wait for utterance to be sent
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 600))
            })

            // Verify utterance was sent
            expect(mockEmbeddedService.utilAPI.sendTextMessage).toHaveBeenCalledWith('get me access token')

            // Clear mock
            mockEmbeddedService.utilAPI.sendTextMessage.mockClear()

            // End the conversation
            await act(async () => {
                window.dispatchEvent(new Event('onEmbeddedMessagingConversationEnded'))
            })

            // Now start a new conversation and send welcome message (should send utterance again)
            await act(async () => {
                window.dispatchEvent(new Event('onEmbeddedMessagingConversationStarted'))
            })

            await act(async () => {
                window.dispatchEvent(welcomeMessageEvent)
            })

            // Wait for the setTimeout to execute
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 600))
            })

            // Verify utterance was sent again
            expect(mockEmbeddedService.utilAPI.sendTextMessage).toHaveBeenCalledWith('get me access token')
        })

        test('should handle error when sendTextMessage fails', async () => {
            // Mock console.error to capture error logging
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
            
            // Mock sendTextMessage to reject
            mockEmbeddedService.utilAPI.sendTextMessage.mockRejectedValue(new Error('API Error'))

            render(<ShopperAgent {...defaultProps} />)

            // Start conversation and send welcome message
            await act(async () => {
                window.dispatchEvent(new Event('onEmbeddedMessagingConversationStarted'))
            })

            const welcomeMessageEvent = new CustomEvent('onEmbeddedMessageSent', {
                detail: {
                    conversationEntry: {
                        sender: {
                            role: 'Chatbot'
                        }
                    }
                }
            })

            await act(async () => {
                window.dispatchEvent(welcomeMessageEvent)
            })

            // Wait for the setTimeout to execute
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 600))
            })

            // Verify error was logged
            expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error))

            // Cleanup
            consoleSpy.mockRestore()
        })

        test('should clean up all conversation event listeners on unmount', () => {
            const {unmount} = render(<ShopperAgent {...defaultProps} />)

            // Spy on removeEventListener
            const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

            // Unmount the component
            unmount()

            // Verify that all conversation event listeners were removed
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'onEmbeddedMessagingConversationStarted',
                expect.any(Function)
            )
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'onEmbeddedMessageSent',
                expect.any(Function)
            )
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'onEmbeddedMessagingConversationOpened',
                expect.any(Function)
            )
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                'onEmbeddedMessagingConversationEnded',
                expect.any(Function)
            )

            // Clean up
            removeEventListenerSpy.mockRestore()
        })
    })
})
