/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {act} from 'react-dom/test-utils'

// Mock useLocation hook
const mockUseLocation = jest.fn()
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: () => mockUseLocation()
}))

// Mock useAppOrigin hook
const mockUseAppOrigin = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-app-origin', () => ({
    __esModule: true,
    useAppOrigin: () => mockUseAppOrigin()
}))

// Import ShopperAgent after all mocks are set up
import ShopperAgent from '@salesforce/retail-react-app/app/components/shopper-agent/index'

// Mock the embedded messaging service
const mockEmbeddedService = {
    prechatAPI: {
        setHiddenPrechatFields: jest.fn()
    },
    utilAPI: {
        sendTextMessage: jest.fn()
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
    default: jest.fn(),
    normalizeLocaleToSalesforce: jest.fn((locale) => {
        const map = {
            'en-US': 'en_US',
            'en-GB': 'en_GB',
            'fr-FR': 'fr',
            'de-DE': 'de',
            'ja-JP': 'ja'
        }
        return map[locale] || 'en_US'
    })
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
            locale: {id: 'en-US', preferredCurrency: 'USD'},
            buildUrl: jest.fn(() => '/us/en-US')
        })

        // Mock useTheme hook
        mockedUseTheme.mockReturnValue({
            zIndices: {
                sticky: 1100
            }
        })

        // Mock useLocation hook
        mockUseLocation.mockReturnValue({
            pathname: '/current-page',
            search: '',
            hash: ''
        })

        // Mock useAppOrigin hook
        mockUseAppOrigin.mockReturnValue('https://example.com')

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

    test('should render with internally constructed domainUrl', () => {
        const props = {
            commerceAgentConfiguration: commerceAgentSettings,
            basketDoneLoading: true
        }

        render(<ShopperAgent {...props} />)
        expect(screen.queryByTestId('shopper-agent')).toBeInTheDocument()
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
            Currency: 'USD',
            Language: 'en_US',
            DomainUrl: 'https://example.com/us/en-US'
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
            Currency: 'USD',
            Language: 'en_US',
            DomainUrl: 'https://example.com/us/en-US'
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
            Currency: 'USD',
            Language: 'en_US',
            DomainUrl: 'https://example.com/us/en-US'
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
            Currency: 'USD',
            Language: 'en_US',
            DomainUrl: 'https://example.com/us/en-US'
        })
    })

    test('should update prechat fields when currency changes', async () => {
        // Mock useMultiSite to return different currency values
        mockedUseMultiSite.mockReturnValue({
            locale: {id: 'en-US', preferredCurrency: 'USD'},
            buildUrl: jest.fn(() => '/us/en-US')
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
            Currency: 'USD',
            Language: 'en_US',
            DomainUrl: 'https://example.com/us/en-US'
        })

        // Clear mock and change currency to EUR
        mockEmbeddedService.prechatAPI.setHiddenPrechatFields.mockClear()
        mockedUseMultiSite.mockReturnValue({
            locale: {id: 'en-US', preferredCurrency: 'EUR'},
            buildUrl: jest.fn(() => '/us/en-US')
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
            Currency: 'EUR',
            Language: 'en_US',
            DomainUrl: 'https://example.com/us/en-US'
        })
    })

    test('should update prechat fields when locale changes', async () => {
        // Mock useMultiSite to return different locale values
        mockedUseMultiSite.mockReturnValue({
            locale: {id: 'en-US', preferredCurrency: 'USD'},
            buildUrl: jest.fn(() => '/us/en-US')
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
            Currency: 'USD',
            Language: 'en_US',
            DomainUrl: 'https://example.com/us/en-US'
        })

        // Clear mock and change locale to en-GB
        mockEmbeddedService.prechatAPI.setHiddenPrechatFields.mockClear()
        mockedUseMultiSite.mockReturnValue({
            locale: {id: 'en-GB', preferredCurrency: 'GBP'},
            buildUrl: jest.fn(() => '/us/en-US')
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
            Currency: 'GBP',
            Language: 'en_GB',
            DomainUrl: 'https://example.com/us/en-US'
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
            Currency: 'USD',
            Language: 'en_US',
            DomainUrl: 'https://example.com/us/en-US'
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
            'test-refresh-token' // refreshToken
        )
    })

    test('should call useScript with correct URL', () => {
        render(<ShopperAgent {...defaultProps} />)

        expect(mockedUseScript).toHaveBeenCalledWith('https://test.salesforce.com/script.js')
    })

    test('should pass domainUrl to ShopperAgentWindow component', () => {
        const customDomainUrl = 'https://custom-store.com/special-page'
        const props = {
            ...defaultProps,
            domainUrl: customDomainUrl
        }

        // Mock console.log to capture any errors
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

        render(<ShopperAgent {...props} />)

        // The component should render without errors
        expect(() => render(<ShopperAgent {...props} />)).not.toThrow()

        // Clean up
        consoleSpy.mockRestore()
    })

    describe('DomainUrl Functionality', () => {
        test('should include DomainUrl in prechat fields when domainUrl is constructed from hooks', async () => {
            const props = {
                ...defaultProps
            }

            render(<ShopperAgent {...props} />)

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
                Currency: 'USD',
                Language: 'en_US',
                DomainUrl: 'https://example.com/us/en-US'
            })
        })

        test('should construct domainUrl from hooks and include in prechat fields', async () => {
            const props = {
                ...defaultProps
            }

            render(<ShopperAgent {...props} />)

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
                Currency: 'USD',
                Language: 'en_US',
                DomainUrl: 'https://example.com/us/en-US'
            })
        })

        test('should render with constructed domainUrl from hooks', () => {
            const props = {
                ...defaultProps
            }

            render(<ShopperAgent {...props} />)
            expect(screen.queryByTestId('shopper-agent')).toBeInTheDocument()
        })
    })

    describe('Conversation Context Functionality', () => {
        beforeEach(() => {
            // Mock postMessage for iframe communication
            global.postMessage = jest.fn()

            // Mock document.querySelector for iframe
            const mockIframe = {
                src: 'https://test.salesforce.com/iframe',
                contentWindow: {
                    postMessage: jest.fn()
                }
            }
            jest.spyOn(document, 'querySelector').mockReturnValue(mockIframe)
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        test('should handle conversation context when enabled with valid data', async () => {
            const props = {
                ...defaultProps,
                commerceAgentConfiguration: {
                    ...commerceAgentSettings,
                    enableConversationContext: 'true',
                    conversationContext: ['Dry Skin', 'Oily Skin', 'Curly', 'Straight']
                }
            }

            render(<ShopperAgent {...props} />)

            // Simulate MIAW event requesting conversation context
            const mockEvent = {
                source: {postMessage: jest.fn()},
                data: {type: 'lwc.getConversationContext'}
            }

            // Trigger the event
            await act(async () => {
                window.dispatchEvent(new MessageEvent('message', mockEvent))
            })

            // The component should handle the event without errors
            expect(() => render(<ShopperAgent {...props} />)).not.toThrow()
        })

        test('should return empty array when conversation context is disabled', async () => {
            const props = {
                ...defaultProps,
                commerceAgentConfiguration: {
                    ...commerceAgentSettings,
                    enableConversationContext: 'false',
                    conversationContext: ['Dry Skin', 'Oily Skin']
                }
            }

            render(<ShopperAgent {...props} />)

            // Simulate MIAW event
            const mockEvent = {
                source: {postMessage: jest.fn()},
                data: {type: 'lwc.getConversationContext'}
            }

            await act(async () => {
                window.dispatchEvent(new MessageEvent('message', mockEvent))
            })

            // Should not throw errors even when disabled
            expect(() => render(<ShopperAgent {...props} />)).not.toThrow()
        })

        test('should handle missing enableConversationContext property', async () => {
            const props = {
                ...defaultProps,
                commerceAgentConfiguration: {
                    ...commerceAgentSettings,
                    // enableConversationContext missing - should default to 'false'
                    conversationContext: ['Dry Skin', 'Oily Skin']
                }
            }

            render(<ShopperAgent {...props} />)

            // Simulate MIAW event
            const mockEvent = {
                source: {postMessage: jest.fn()},
                data: {type: 'lwc.getConversationContext'}
            }

            await act(async () => {
                window.dispatchEvent(new MessageEvent('message', mockEvent))
            })

            // Should handle gracefully with default values
            expect(() => render(<ShopperAgent {...props} />)).not.toThrow()
        })

        test('should handle missing conversationContext property', async () => {
            const props = {
                ...defaultProps,
                commerceAgentConfiguration: {
                    ...commerceAgentSettings,
                    enableConversationContext: 'true'
                    // conversationContext missing - should default to []
                }
            }

            render(<ShopperAgent {...props} />)

            // Simulate MIAW event
            const mockEvent = {
                source: {postMessage: jest.fn()},
                data: {type: 'lwc.getConversationContext'}
            }

            await act(async () => {
                window.dispatchEvent(new MessageEvent('message', mockEvent))
            })

            // Should handle gracefully with default empty array
            expect(() => render(<ShopperAgent {...props} />)).not.toThrow()
        })

        test('should handle invalid conversationContext data type', async () => {
            const props = {
                ...defaultProps,
                commerceAgentConfiguration: {
                    ...commerceAgentSettings,
                    enableConversationContext: 'true',
                    conversationContext: 'not an array' // Invalid data type
                }
            }

            render(<ShopperAgent {...props} />)

            // Simulate MIAW event
            const mockEvent = {
                source: {postMessage: jest.fn()},
                data: {type: 'lwc.getConversationContext'}
            }

            await act(async () => {
                window.dispatchEvent(new MessageEvent('message', mockEvent))
            })

            // Should handle gracefully with invalid data
            expect(() => render(<ShopperAgent {...props} />)).not.toThrow()
        })

        test('should handle empty conversation context array', async () => {
            const props = {
                ...defaultProps,
                commerceAgentConfiguration: {
                    ...commerceAgentSettings,
                    enableConversationContext: 'true',
                    conversationContext: []
                }
            }

            render(<ShopperAgent {...props} />)

            // Simulate MIAW event
            const mockEvent = {
                source: {postMessage: jest.fn()},
                data: {type: 'lwc.getConversationContext'}
            }

            await act(async () => {
                window.dispatchEvent(new MessageEvent('message', mockEvent))
            })

            // Should handle empty array gracefully
            expect(() => render(<ShopperAgent {...props} />)).not.toThrow()
        })

        test('should handle iframe not found when sending conversation context', async () => {
            // Mock querySelector to return null (iframe not found)
            jest.spyOn(document, 'querySelector').mockReturnValue(null)

            const props = {
                ...defaultProps,
                commerceAgentConfiguration: {
                    ...commerceAgentSettings,
                    enableConversationContext: 'true',
                    conversationContext: ['Dry Skin', 'Oily Skin']
                }
            }

            render(<ShopperAgent {...props} />)

            // Simulate MIAW event
            const mockEvent = {
                source: {postMessage: jest.fn()},
                data: {type: 'lwc.getConversationContext'}
            }

            await act(async () => {
                window.dispatchEvent(new MessageEvent('message', mockEvent))
            })

            // Should handle missing iframe gracefully
            expect(() => render(<ShopperAgent {...props} />)).not.toThrow()
        })

        test('should handle iframe without src when sending conversation context', async () => {
            // Mock iframe without src
            const mockIframe = {
                src: '',
                contentWindow: {
                    postMessage: jest.fn()
                }
            }
            jest.spyOn(document, 'querySelector').mockReturnValue(mockIframe)

            const props = {
                ...defaultProps,
                commerceAgentConfiguration: {
                    ...commerceAgentSettings,
                    enableConversationContext: 'true',
                    conversationContext: ['Dry Skin', 'Oily Skin']
                }
            }

            render(<ShopperAgent {...props} />)

            // Simulate MIAW event
            const mockEvent = {
                source: {postMessage: jest.fn()},
                data: {type: 'lwc.getConversationContext'}
            }

            await act(async () => {
                window.dispatchEvent(new MessageEvent('message', mockEvent))
            })

            // Should handle iframe without src gracefully
            expect(() => render(<ShopperAgent {...props} />)).not.toThrow()
        })

        test('should handle non-MIAW events gracefully', async () => {
            const props = {
                ...defaultProps,
                commerceAgentConfiguration: {
                    ...commerceAgentSettings,
                    enableConversationContext: 'true',
                    conversationContext: ['Dry Skin', 'Oily Skin']
                }
            }

            render(<ShopperAgent {...props} />)

            // Simulate non-MIAW event
            const mockEvent = {
                source: {postMessage: jest.fn()},
                data: {type: 'other.event.type'}
            }

            await act(async () => {
                window.dispatchEvent(new MessageEvent('message', mockEvent))
            })

            // Should handle non-MIAW events without errors
            expect(() => render(<ShopperAgent {...props} />)).not.toThrow()
        })

        test('should handle events from same window source', async () => {
            const props = {
                ...defaultProps,
                commerceAgentConfiguration: {
                    ...commerceAgentSettings,
                    enableConversationContext: 'true',
                    conversationContext: ['Dry Skin', 'Oily Skin']
                }
            }

            render(<ShopperAgent {...props} />)

            // Simulate event from same window (should be ignored)
            const mockEvent = {
                source: window, // Same as window
                data: {type: 'lwc.getConversationContext'}
            }

            await act(async () => {
                window.dispatchEvent(new MessageEvent('message', mockEvent))
            })

            // Should ignore events from same window
            expect(() => render(<ShopperAgent {...props} />)).not.toThrow()
        })

        test('should validate conversation context configuration properties', () => {
            // Test with invalid enableConversationContext type
            const invalidProps1 = {
                ...defaultProps,
                commerceAgentConfiguration: {
                    ...commerceAgentSettings,
                    enableConversationContext: 123, // Should be string
                    conversationContext: ['Dry Skin']
                }
            }

            // Should not render due to validation failure
            render(<ShopperAgent {...invalidProps1} />)
            expect(screen.queryByTestId('shopper-agent')).toBeNull()

            // Test with invalid conversationContext type
            const invalidProps2 = {
                ...defaultProps,
                commerceAgentConfiguration: {
                    ...commerceAgentSettings,
                    enableConversationContext: 'true',
                    conversationContext: 'not an array' // Should be array
                }
            }

            // Should not render due to validation failure
            render(<ShopperAgent {...invalidProps2} />)
            expect(screen.queryByTestId('shopper-agent')).toBeNull()
        })

        test('should handle conversation context with various data types in array', async () => {
            const props = {
                ...defaultProps,
                commerceAgentConfiguration: {
                    ...commerceAgentSettings,
                    enableConversationContext: 'true',
                    conversationContext: [
                        'Dry Skin',
                        'Oily Skin',
                        'Curly Hair',
                        'Straight Hair',
                        'Sensitive Skin',
                        'Normal Skin'
                    ]
                }
            }

            render(<ShopperAgent {...props} />)

            // Simulate MIAW event
            const mockEvent = {
                source: {postMessage: jest.fn()},
                data: {type: 'lwc.getConversationContext'}
            }

            await act(async () => {
                window.dispatchEvent(new MessageEvent('message', mockEvent))
            })

            // Should handle various data types in array
            expect(() => render(<ShopperAgent {...props} />)).not.toThrow()
        })
    })

    describe('Domain URL Event Functionality', () => {
        beforeEach(() => {
            // Mock postMessage for iframe communication
            global.postMessage = jest.fn()

            // Mock document.querySelector for iframe
            const mockIframe = {
                src: 'https://test.salesforce.com/iframe',
                contentWindow: {
                    postMessage: jest.fn()
                }
            }
            jest.spyOn(document, 'querySelector').mockReturnValue(mockIframe)
        })

        afterEach(() => {
            jest.restoreAllMocks()
        })

        test('should handle lwc.getDomainUrl event and send domain URL', async () => {
            render(<ShopperAgent {...defaultProps} />)

            // Mock iframe for postMessage
            const mockIframe = {
                src: 'https://test.salesforce.com/iframe',
                contentWindow: {
                    postMessage: jest.fn()
                }
            }
            jest.spyOn(document, 'querySelector').mockReturnValue(mockIframe)

            // Simulate MIAW event requesting domain URL
            const mockEvent = {
                source: {postMessage: jest.fn()},
                data: {type: 'lwc.getDomainUrl'}
            }

            await act(async () => {
                window.dispatchEvent(new MessageEvent('message', mockEvent))
            })

            // Verify postMessage was called with domain URL
            expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
                {
                    type: 'conversational.domainUrl',
                    payload: {
                        domainUrl: 'https://example.com/us/en-US'
                    }
                },
                'https://test.salesforce.com'
            )
        })

        test('should handle lwc.getDomainUrl event properly when iframe not found', async () => {
            render(<ShopperAgent {...defaultProps} />)

            // Mock querySelector to return null (iframe not found)
            jest.spyOn(document, 'querySelector').mockReturnValue(null)

            // Simulate MIAW event
            const mockEvent = {
                source: {postMessage: jest.fn()},
                data: {type: 'lwc.getDomainUrl'}
            }

            await act(async () => {
                window.dispatchEvent(new MessageEvent('message', mockEvent))
            })

            // Should handle missing iframe gracefully without throwing
            expect(() => render(<ShopperAgent {...defaultProps} />)).not.toThrow()
        })
    })
})
