/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import {act} from 'react-dom/test-utils'

// Mock useAppOrigin hook
const mockUseAppOrigin = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-app-origin', () => ({
    __esModule: true,
    useAppOrigin: () => mockUseAppOrigin()
}))

const mockShowToast = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-toast', () => ({
    __esModule: true,
    useToast: jest.fn(() => mockShowToast)
}))

const mockFormatMessage = jest.fn((descriptor) => descriptor.defaultMessage ?? descriptor.id)
jest.mock('react-intl', () => ({
    __esModule: true,
    ...jest.requireActual('react-intl'),
    useIntl: jest.fn(() => ({formatMessage: mockFormatMessage}))
}))

// Mock the Token Bridge browser helper. The ShopperAgent calls this when a
// conversation starts, replacing the previous postSessionInit SCAPI mutation.
const mockCallTokenBridge = jest.fn()
jest.mock('@salesforce/retail-react-app/app/components/shopper-agent/token-bridge', () => ({
    __esModule: true,
    callTokenBridge: (...args) => mockCallTokenBridge(...args)
}))

// Import ShopperAgent after all mocks are set up
import ShopperAgent from '@salesforce/retail-react-app/app/components/shopper-agent/index'
import {
    COMMERCE_CLIENT_CDN_BASE_URL,
    COMMERCE_CLIENT_OPEN_STATE_KEY
} from '@salesforce/retail-react-app/app/constants'

// Mock the embedded messaging service
const mockEmbeddedService = {
    prechatAPI: {
        setHiddenPrechatFields: jest.fn()
    },
    utilAPI: {
        sendTextMessage: jest.fn()
    },
    userVerificationAPI: {
        clearSession: jest.fn().mockResolvedValue(undefined),
        getAuthLinkKey: jest.fn().mockResolvedValue('test-auth-link-key')
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

// Mock the useCommerceClientMessaging hook (Commerce Client provider)
jest.mock('@salesforce/retail-react-app/app/hooks/use-commerce-client-messaging', () => ({
    __esModule: true,
    default: jest.fn()
}))

// Mock the Commerce Client FAB (internals covered by commerce-client-fab.test.js).
jest.mock('@salesforce/retail-react-app/app/components/shopper-agent/commerce-client-fab', () => ({
    __esModule: true,
    default: (props) => {
        const React = jest.requireActual('react')
        return React.createElement('button', {
            'data-testid': 'commerce-client-fab',
            'data-position': props.position,
            'data-panel-open-by-default': String(props.isPanelOpenByDefault)
        })
    }
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

// useRefreshToken is no longer used (refresh token read server-side from cookies)

// Mock commerce-sdk-react hooks. useAccessToken returns a stable object so the
// component can read getTokenWhenReady() during the conversation-started flow.
jest.mock('@salesforce/commerce-sdk-react', () => ({
    useAccessToken: jest.fn(),
    useUsid: jest.fn(),
    useConfig: jest.fn(),
    useCustomerType: jest.fn(),
    useConfigurations: jest.fn()
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
import {
    useAccessToken,
    useConfig,
    useConfigurations,
    useCustomerType,
    useUsid
} from '@salesforce/commerce-sdk-react'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {useTheme} from '@salesforce/retail-react-app/app/components/shared/ui'
import useCommerceClientMessaging from '@salesforce/retail-react-app/app/hooks/use-commerce-client-messaging'

// Get mocked functions
const mockedUseScript = useScript
const mockedUseMiaw = useMiaw
const mockedUseAccessToken = useAccessToken
const mockedUseUsid = useUsid
const mockedUseConfig = useConfig
const mockedUseConfigurations = useConfigurations
const mockedUseCustomerType = useCustomerType
const mockedUseMultiSite = useMultiSite
const mockedUseTheme = useTheme
const mockedUseCommerceClientMessaging = useCommerceClientMessaging

const mockGetTokenWhenReady = jest.fn()

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

        // Mock useUsid hook
        mockedUseUsid.mockReturnValue({usid: 'test-usid'})

        // Mock useAccessToken hook
        mockGetTokenWhenReady.mockReset()
        mockGetTokenWhenReady.mockResolvedValue('test-slas-access-token')
        mockedUseAccessToken.mockReturnValue({getTokenWhenReady: mockGetTokenWhenReady})

        // Mock useConfig hook
        mockedUseConfig.mockReturnValue({
            organizationId: '00DTEST00000001',
            siteId: 'RefArchGlobal'
        })

        mockedUseCustomerType.mockReturnValue({
            customerType: 'guest',
            isGuest: true,
            isRegistered: false,
            isExternal: false
        })

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

        // Mock useAppOrigin hook
        mockUseAppOrigin.mockReturnValue('https://example.com')

        // Mock useConfigurations hook
        mockedUseConfigurations.mockReturnValue({
            data: {
                configurations: [
                    {
                        configurationType: 'globalConfiguration',
                        id: 'my_domain',
                        value: 'https://orgfarm-1234.test1.my.pc-rnd.salesforce.com'
                    }
                ]
            }
        })

        // Default Token Bridge response: success
        mockCallTokenBridge.mockReset()
        mockCallTokenBridge.mockResolvedValue({status: 200, body: {ok: true}})

        mockShowToast.mockClear()
        mockFormatMessage.mockImplementation(
            (descriptor) => descriptor.defaultMessage ?? descriptor.id
        )
        mockEmbeddedService.userVerificationAPI.clearSession.mockClear()
        mockEmbeddedService.userVerificationAPI.clearSession.mockResolvedValue(undefined)
        mockEmbeddedService.userVerificationAPI.getAuthLinkKey.mockClear()
        mockEmbeddedService.userVerificationAPI.getAuthLinkKey.mockResolvedValue(
            'test-auth-link-key'
        )

        global.window.embeddedservice_bootstrap = mockEmbeddedService
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

    test('should reset embedded messaging when customer type changes from guest to registered', async () => {
        const {rerender} = render(<ShopperAgent {...defaultProps} />)

        expect(mockEmbeddedService.userVerificationAPI.clearSession).not.toHaveBeenCalled()

        mockedUseCustomerType.mockReturnValue({
            customerType: 'registered',
            isGuest: false,
            isRegistered: true,
            isExternal: false
        })

        await act(async () => {
            rerender(<ShopperAgent {...defaultProps} />)
        })

        expect(mockEmbeddedService.userVerificationAPI.clearSession).toHaveBeenCalledWith(true)
    })

    test('should reset embedded messaging when customer type changes from registered to guest', async () => {
        mockedUseCustomerType.mockReturnValue({
            customerType: 'registered',
            isGuest: false,
            isRegistered: true,
            isExternal: false
        })

        const {rerender} = render(<ShopperAgent {...defaultProps} />)

        mockEmbeddedService.userVerificationAPI.clearSession.mockClear()

        mockedUseCustomerType.mockReturnValue({
            customerType: 'guest',
            isGuest: true,
            isRegistered: false,
            isExternal: false
        })

        await act(async () => {
            rerender(<ShopperAgent {...defaultProps} />)
        })

        expect(mockEmbeddedService.userVerificationAPI.clearSession).toHaveBeenCalledWith(true)
    })

    test('should reset embedded messaging when customer type changes from registered to null (logout)', async () => {
        mockedUseCustomerType.mockReturnValue({
            customerType: 'registered',
            isGuest: false,
            isRegistered: true,
            isExternal: false
        })

        const {rerender} = render(<ShopperAgent {...defaultProps} />)

        mockEmbeddedService.userVerificationAPI.clearSession.mockClear()

        mockedUseCustomerType.mockReturnValue({
            customerType: null,
            isGuest: false,
            isRegistered: false,
            isExternal: false
        })

        await act(async () => {
            rerender(<ShopperAgent {...defaultProps} />)
        })

        expect(mockEmbeddedService.userVerificationAPI.clearSession).toHaveBeenCalledWith(true)
    })

    test('should reset embedded messaging when customer type changes from guest to null', async () => {
        const {rerender} = render(<ShopperAgent {...defaultProps} />)

        mockEmbeddedService.userVerificationAPI.clearSession.mockClear()

        mockedUseCustomerType.mockReturnValue({
            customerType: null,
            isGuest: false,
            isRegistered: false,
            isExternal: false
        })

        await act(async () => {
            rerender(<ShopperAgent {...defaultProps} />)
        })

        expect(mockEmbeddedService.userVerificationAPI.clearSession).toHaveBeenCalledWith(true)
    })

    test('should NOT reset embedded messaging on initial mount', async () => {
        render(<ShopperAgent {...defaultProps} />)

        // Initial mount should not trigger clearSession
        expect(mockEmbeddedService.userVerificationAPI.clearSession).not.toHaveBeenCalled()
    })

    test('should NOT reset embedded messaging when customer type stays the same', async () => {
        const {rerender} = render(<ShopperAgent {...defaultProps} />)

        mockEmbeddedService.userVerificationAPI.clearSession.mockClear()

        // Re-render with same customerType
        mockedUseCustomerType.mockReturnValue({
            customerType: 'guest',
            isGuest: true,
            isRegistered: false,
            isExternal: false
        })

        await act(async () => {
            rerender(<ShopperAgent {...defaultProps} />)
        })

        expect(mockEmbeddedService.userVerificationAPI.clearSession).not.toHaveBeenCalled()
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
            Currency: 'USD',
            Language: 'en_US',
            DomainUrl: 'https://example.com/us/en-US'
        })
    })

    test('should NOT call Token Bridge on embedded messaging ready', async () => {
        render(<ShopperAgent {...defaultProps} />)

        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingReady'))
        })

        expect(mockCallTokenBridge).not.toHaveBeenCalled()
    })

    test('should call Token Bridge with auth link key, access token, and refresh token when conversation starts', async () => {
        render(<ShopperAgent {...defaultProps} />)

        await act(async () => {
            window.dispatchEvent(
                new CustomEvent('onEmbeddedMessagingConversationStarted', {
                    detail: {conversationId: 'conv-1'}
                })
            )
        })

        await waitFor(() => expect(mockCallTokenBridge).toHaveBeenCalledTimes(1))
        expect(mockCallTokenBridge).toHaveBeenCalledWith({
            authLinkKey: 'test-auth-link-key',
            slasAccessToken: 'test-slas-access-token',
            siteId: 'RefArchGlobal'
        })
    })

    test('should dedupe Token Bridge calls for duplicate started events with same conversationId', async () => {
        render(<ShopperAgent {...defaultProps} />)

        await act(async () => {
            window.dispatchEvent(
                new CustomEvent('onEmbeddedMessagingConversationStarted', {
                    detail: {conversationId: 'same-id'}
                })
            )
            window.dispatchEvent(
                new CustomEvent('onEmbeddedMessagingConversationStarted', {
                    detail: {conversationId: 'same-id'}
                })
            )
        })

        await waitFor(() => expect(mockCallTokenBridge).toHaveBeenCalledTimes(1))
    })

    test('should not show error toast or reset session when Token Bridge returns 200', async () => {
        render(<ShopperAgent {...defaultProps} />)

        await act(async () => {
            window.dispatchEvent(
                new CustomEvent('onEmbeddedMessagingConversationStarted', {
                    detail: {conversationId: 'conv-2'}
                })
            )
        })

        await waitFor(() => expect(mockCallTokenBridge).toHaveBeenCalledTimes(1))

        // Wait a bit to ensure no error handling runs
        await new Promise((resolve) => setTimeout(resolve, 100))

        expect(mockShowToast).not.toHaveBeenCalled()
        expect(mockEmbeddedService.userVerificationAPI.clearSession).not.toHaveBeenCalled()
    })

    test('should reset session and toast error when Token Bridge returns non-200 status', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        mockCallTokenBridge.mockResolvedValueOnce({
            status: 401,
            body: {error: 'INVALID_SLAS_TOKEN'}
        })

        render(<ShopperAgent {...defaultProps} />)

        await act(async () => {
            window.dispatchEvent(
                new CustomEvent('onEmbeddedMessagingConversationStarted', {
                    detail: {conversationId: 'conv-3'}
                })
            )
        })

        await waitFor(() =>
            expect(mockEmbeddedService.userVerificationAPI.clearSession).toHaveBeenCalled()
        )
        expect(errorSpy).toHaveBeenCalledWith('Token Bridge failed', {
            status: 401,
            error: 'INVALID_SLAS_TOKEN'
        })
        expect(mockShowToast).toHaveBeenCalledTimes(1)
        const toastPayload = mockShowToast.mock.calls[0][0]
        expect(toastPayload.status).toBe('error')

        errorSpy.mockRestore()
    })

    test('should reset session and toast error when Token Bridge throws', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        mockCallTokenBridge.mockRejectedValueOnce(new Error('network down'))

        render(<ShopperAgent {...defaultProps} />)

        await act(async () => {
            window.dispatchEvent(
                new CustomEvent('onEmbeddedMessagingConversationStarted', {
                    detail: {conversationId: 'conv-4'}
                })
            )
        })

        await waitFor(() =>
            expect(mockEmbeddedService.userVerificationAPI.clearSession).toHaveBeenCalled()
        )
        expect(errorSpy).toHaveBeenCalledWith('Token Bridge threw', expect.any(Error))
        expect(mockShowToast).toHaveBeenCalledTimes(1)

        errorSpy.mockRestore()
    })

    test('should fall back to HTTP_<status> when Token Bridge body has no error code', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        mockCallTokenBridge.mockResolvedValueOnce({status: 503, body: null})

        render(<ShopperAgent {...defaultProps} />)

        await act(async () => {
            window.dispatchEvent(
                new CustomEvent('onEmbeddedMessagingConversationStarted', {
                    detail: {conversationId: 'conv-5'}
                })
            )
        })

        await waitFor(() => expect(errorSpy).toHaveBeenCalled())
        expect(errorSpy).toHaveBeenCalledWith('Token Bridge failed', {
            status: 503,
            error: 'HTTP_503'
        })

        errorSpy.mockRestore()
    })

    test('should log error and not call Token Bridge when getAuthLinkKey is unavailable', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const bootstrapWithoutUv = {
            ...mockEmbeddedService,
            userVerificationAPI: undefined
        }
        global.window.embeddedservice_bootstrap = bootstrapWithoutUv

        render(<ShopperAgent {...defaultProps} />)

        await act(async () => {
            window.dispatchEvent(
                new CustomEvent('onEmbeddedMessagingConversationStarted', {
                    detail: {conversationId: 'conv-6'}
                })
            )
        })

        expect(errorSpy).toHaveBeenCalledWith('Shopper Agent: getAuthLinkKey is not available')
        expect(mockCallTokenBridge).not.toHaveBeenCalled()

        errorSpy.mockRestore()
        global.window.embeddedservice_bootstrap = mockEmbeddedService
    })

    test('should reset session, toast error, and not call Token Bridge when getAuthLinkKey rejects', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const rejection = new Error('auth link key rejected')
        mockEmbeddedService.userVerificationAPI.getAuthLinkKey.mockRejectedValueOnce(rejection)

        render(<ShopperAgent {...defaultProps} />)

        await act(async () => {
            window.dispatchEvent(
                new CustomEvent('onEmbeddedMessagingConversationStarted', {
                    detail: {conversationId: 'conv-7'}
                })
            )
        })

        await waitFor(() =>
            expect(errorSpy).toHaveBeenCalledWith('Shopper Agent: getAuthLinkKey failed', rejection)
        )
        expect(mockCallTokenBridge).not.toHaveBeenCalled()
        await waitFor(() =>
            expect(mockEmbeddedService.userVerificationAPI.clearSession).toHaveBeenCalled()
        )
        expect(mockShowToast).toHaveBeenCalledTimes(1)
        expect(mockShowToast.mock.calls[0][0].status).toBe('error')

        errorSpy.mockRestore()
    })

    test('should NOT call Token Bridge when organizationId or siteId is missing', async () => {
        mockedUseConfig.mockReturnValue({
            organizationId: '',
            siteId: ''
        })

        render(<ShopperAgent {...defaultProps} />)

        await act(async () => {
            window.dispatchEvent(
                new CustomEvent('onEmbeddedMessagingConversationStarted', {
                    detail: {conversationId: 'conv-8'}
                })
            )
        })

        expect(mockCallTokenBridge).not.toHaveBeenCalled()
    })

    test('should NOT call Token Bridge when my_domain is not configured', async () => {
        // Mock useConfigurations to return no my_domain configuration
        mockedUseConfigurations.mockReturnValue({
            data: {
                configurations: []
            }
        })

        render(<ShopperAgent {...defaultProps} />)

        await act(async () => {
            window.dispatchEvent(
                new CustomEvent('onEmbeddedMessagingConversationStarted', {
                    detail: {conversationId: 'conv-9'}
                })
            )
        })

        expect(mockCallTokenBridge).not.toHaveBeenCalled()
    })

    test('should NOT call Token Bridge when my_domain value is empty', async () => {
        // Mock useConfigurations to return empty my_domain value
        mockedUseConfigurations.mockReturnValue({
            data: {
                configurations: [
                    {
                        configurationType: 'globalConfiguration',
                        id: 'my_domain',
                        value: ''
                    }
                ]
            }
        })

        render(<ShopperAgent {...defaultProps} />)

        await act(async () => {
            window.dispatchEvent(
                new CustomEvent('onEmbeddedMessagingConversationStarted', {
                    detail: {conversationId: 'conv-10'}
                })
            )
        })

        expect(mockCallTokenBridge).not.toHaveBeenCalled()
    })

    test('should NOT call Token Bridge when useConfigurations returns undefined', async () => {
        // Mock useConfigurations to return undefined data
        mockedUseConfigurations.mockReturnValue({
            data: undefined
        })

        render(<ShopperAgent {...defaultProps} />)

        await act(async () => {
            window.dispatchEvent(
                new CustomEvent('onEmbeddedMessagingConversationStarted', {
                    detail: {conversationId: 'conv-11'}
                })
            )
        })

        expect(mockCallTokenBridge).not.toHaveBeenCalled()
    })

    test('should detect HttpOnly mode and omit access token when flag is enabled', async () => {
        // Simulate HttpOnly mode: set the flag
        window.__MRT_ENABLE_HTTPONLY_SESSION_COOKIES__ = 'true'

        render(<ShopperAgent {...defaultProps} />)

        await act(async () => {
            window.dispatchEvent(
                new CustomEvent('onEmbeddedMessagingConversationStarted', {
                    detail: {conversationId: 'conv-12'}
                })
            )
        })

        await waitFor(() => expect(mockCallTokenBridge).toHaveBeenCalledTimes(1))
        expect(mockCallTokenBridge).toHaveBeenCalledWith({
            authLinkKey: 'test-auth-link-key',
            slasAccessToken: undefined, // Omitted in HttpOnly mode
            siteId: 'RefArchGlobal'
        })

        // Verify getTokenWhenReady was NOT called in HttpOnly mode
        expect(mockGetTokenWhenReady).not.toHaveBeenCalled()

        // Clean up
        delete window.__MRT_ENABLE_HTTPONLY_SESSION_COOKIES__
    })

    test('should fetch access token in non-HttpOnly mode', async () => {
        // Simulate non-HttpOnly mode: flag is false or unset
        window.__MRT_ENABLE_HTTPONLY_SESSION_COOKIES__ = 'false'

        render(<ShopperAgent {...defaultProps} />)

        await act(async () => {
            window.dispatchEvent(
                new CustomEvent('onEmbeddedMessagingConversationStarted', {
                    detail: {conversationId: 'conv-13'}
                })
            )
        })

        await waitFor(() => expect(mockCallTokenBridge).toHaveBeenCalledTimes(1))
        expect(mockCallTokenBridge).toHaveBeenCalledWith({
            authLinkKey: 'test-auth-link-key',
            slasAccessToken: 'test-slas-access-token', // Token fetched from localStorage
            siteId: 'RefArchGlobal'
        })

        // Verify getTokenWhenReady WAS called in non-HttpOnly mode
        expect(mockGetTokenWhenReady).toHaveBeenCalled()

        // Clean up
        delete window.__MRT_ENABLE_HTTPONLY_SESSION_COOKIES__
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

        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

        unmount()

        expect(removeEventListenerSpy).toHaveBeenCalledWith(
            'onEmbeddedMessagingReady',
            expect.any(Function)
        )
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
            'onEmbeddedMessagingConversationStarted',
            expect.any(Function)
        )
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
            'onEmbeddedMessagingWindowMaximized',
            expect.any(Function)
        )

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
            'true' // enableAgentFromFloatingButton (default)
        )
    })

    test('should call useMiaw with enableAgentFromFloatingButton false when configured', () => {
        const props = {
            ...defaultProps,
            commerceAgentConfiguration: {
                ...commerceAgentSettings,
                enableAgentFromFloatingButton: 'false'
            }
        }

        render(<ShopperAgent {...props} />)

        expect(mockedUseMiaw).toHaveBeenCalledWith(
            {loaded: true, error: false},
            'test-org-id',
            'test-service',
            'https://test.salesforce.com',
            'https://test.salesforce.com/scrt2.js',
            'en-US',
            'false' // enableAgentFromFloatingButton
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

    describe('Commerce Client provider', () => {
        const commerceClientSettings = {
            enabled: 'true',
            provider: 'commerce-client',
            scrt2Url: 'https://test.salesforce-scrt.com',
            salesforceOrgId: 'test-org-id',
            cc_esDeveloperName: 'My_Embedded_Service',
            cc_cdnVersion: '1.0.0'
        }

        const renderCommerceClient = (overrides = {}) =>
            render(
                <ShopperAgent
                    commerceAgentConfiguration={{...commerceClientSettings, ...overrides}}
                    basketDoneLoading={true}
                />
            )

        test('renders the Commerce Client widget when settings are valid', () => {
            renderCommerceClient()

            expect(screen.getByTestId('shopper-agent')).toBeInTheDocument()
            expect(screen.getByTestId('commerce-client-agent-widget')).toBeInTheDocument()
        })

        describe('floating action button gating', () => {
            test('renders the FAB once the bundle has loaded when cc_showFab is true', () => {
                mockedUseScript.mockReturnValue({loaded: true, error: false})

                renderCommerceClient({cc_showFab: 'true'})

                expect(screen.getByTestId('commerce-client-fab')).toBeInTheDocument()
            })

            test('hides the FAB while the bundle is still loading', () => {
                // Cold/slow load: the bundle has not finished loading yet, so the
                // widget cannot be injected and a FAB click would be dropped.
                mockedUseScript.mockReturnValue({loaded: false, error: false})

                renderCommerceClient({cc_showFab: 'true'})

                expect(screen.queryByTestId('commerce-client-fab')).toBeNull()
                // The container still renders so injection can run once loaded.
                expect(screen.getByTestId('commerce-client-agent-widget')).toBeInTheDocument()
            })

            test('keeps the FAB hidden when the bundle fails to load', () => {
                mockedUseScript.mockReturnValue({loaded: false, error: true})

                renderCommerceClient({cc_showFab: 'true'})

                expect(screen.queryByTestId('commerce-client-fab')).toBeNull()
            })

            test('does not render the FAB when cc_showFab is not enabled', () => {
                mockedUseScript.mockReturnValue({loaded: true, error: false})

                renderCommerceClient()

                expect(screen.queryByTestId('commerce-client-fab')).toBeNull()
            })
        })

        test('does not render the MIAW iframe window for the commerce-client provider', () => {
            renderCommerceClient()

            // The MIAW provider boots via useMiaw; the Commerce Client provider must not.
            expect(mockedUseMiaw).not.toHaveBeenCalled()
            expect(mockedUseCommerceClientMessaging).toHaveBeenCalledTimes(1)
        })

        test('does not render when the script URL override is not a trusted cimulate.ai domain', () => {
            renderCommerceClient({
                cc_cdnVersion: undefined,
                commerceClientScriptSourceUrl: 'https://evil.example.com/messaging.umd.js'
            })

            expect(screen.queryByTestId('shopper-agent')).toBeNull()
        })

        test('renders when the script URL override is served from a trusted sfcc-store-internal.net domain', () => {
            renderCommerceClient({
                cc_cdnVersion: undefined,
                commerceClientScriptSourceUrl:
                    'https://www.shop.prd.tbdp.sfcc-store-internal.net/on/demandware.static/Sites-nto-Site/-/en_US/v1782164019601/jscript/cimulate/messaging.umd.js'
            })

            expect(screen.getByTestId('shopper-agent')).toBeInTheDocument()
            expect(screen.getByTestId('commerce-client-agent-widget')).toBeInTheDocument()
        })

        test('does not render when a required Commerce Client field is missing', () => {
            renderCommerceClient({scrt2Url: ''})

            expect(screen.queryByTestId('shopper-agent')).toBeNull()
        })

        test('falls back to embeddedServiceName when cc_esDeveloperName is not provided', () => {
            renderCommerceClient({cc_esDeveloperName: '', embeddedServiceName: 'Fallback_Service'})

            expect(screen.getByTestId('commerce-client-agent-widget')).toBeInTheDocument()
            expect(mockedUseCommerceClientMessaging).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({esDeveloperName: 'Fallback_Service'})
            )
        })

        test('defaults capabilitiesVersion to 65 in the widget options', () => {
            renderCommerceClient()

            expect(mockedUseCommerceClientMessaging).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({capabilitiesVersion: '65'})
            )
        })

        test('forwards a configured capabilitiesVersion to the widget options', () => {
            renderCommerceClient({cc_capabilitiesVersion: '70'})

            expect(mockedUseCommerceClientMessaging).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({capabilitiesVersion: '70'})
            )
        })

        test('forwards cc_routingAttributes to the widget options as routingAttributes', () => {
            renderCommerceClient({cc_routingAttributes: {foo: 'bar'}})

            expect(mockedUseCommerceClientMessaging).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({routingAttributes: {foo: 'bar'}})
            )
        })

        test('forwards cc_overridesUrl to the widget options as overridesUrl', () => {
            renderCommerceClient({cc_overridesUrl: 'https://example.com/overrides.js'})

            expect(mockedUseCommerceClientMessaging).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({overridesUrl: 'https://example.com/overrides.js'})
            )
        })

        test('forwards cc_overrides to the widget options as overrides', () => {
            renderCommerceClient({cc_overrides: {ProductTile: 'my-product-tile'}})

            expect(mockedUseCommerceClientMessaging).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({overrides: {ProductTile: 'my-product-tile'}})
            )
        })

        test('prefers cc_overrides and drops cc_overridesUrl when both are set', () => {
            renderCommerceClient({
                cc_overridesUrl: 'https://example.com/overrides.js',
                cc_overrides: {ProductTile: 'my-product-tile'}
            })

            const calls = mockedUseCommerceClientMessaging.mock.calls
            const widgetOptions = calls[calls.length - 1][1]

            expect(widgetOptions.overrides).toEqual({ProductTile: 'my-product-tile'})
            expect(widgetOptions).not.toHaveProperty('overridesUrl')
        })

        test('falls back to cc_overridesUrl when cc_overrides is an empty map', () => {
            renderCommerceClient({
                cc_overridesUrl: 'https://example.com/overrides.js',
                cc_overrides: {}
            })

            const calls = mockedUseCommerceClientMessaging.mock.calls
            const widgetOptions = calls[calls.length - 1][1]

            expect(widgetOptions.overridesUrl).toBe('https://example.com/overrides.js')
            expect(widgetOptions).not.toHaveProperty('overrides')
        })

        test('omits both override options when neither is configured', () => {
            renderCommerceClient()

            const calls = mockedUseCommerceClientMessaging.mock.calls
            const widgetOptions = calls[calls.length - 1][1]

            expect(widgetOptions).not.toHaveProperty('overridesUrl')
            expect(widgetOptions).not.toHaveProperty('overrides')
        })

        test('omits overrides when cc_overrides is an empty object', () => {
            renderCommerceClient({cc_overrides: {}})

            const calls = mockedUseCommerceClientMessaging.mock.calls
            const widgetOptions = calls[calls.length - 1][1]

            expect(widgetOptions).not.toHaveProperty('overrides')
        })

        test('opens the widget automatically when cc_isOpen is true', () => {
            renderCommerceClient({cc_isOpen: 'true'})

            const calls = mockedUseCommerceClientMessaging.mock.calls
            const widgetOptions = calls[calls.length - 1][1]

            expect(widgetOptions.componentConfig.isOpen).toBe(true)
        })

        test('keeps the widget closed by default (cc_isOpen defaults to false)', () => {
            renderCommerceClient()

            const calls = mockedUseCommerceClientMessaging.mock.calls
            const widgetOptions = calls[calls.length - 1][1]

            expect(widgetOptions.componentConfig.isOpen).toBe(false)
        })

        describe('persisted open-state', () => {
            afterEach(() => {
                window.sessionStorage.removeItem(COMMERCE_CLIENT_OPEN_STATE_KEY)
            })

            test('reopens the widget when the shopper left it open before navigating', () => {
                // Simulate the shopper having left the panel open on a prior page.
                window.sessionStorage.setItem(COMMERCE_CLIENT_OPEN_STATE_KEY, 'true')

                renderCommerceClient({cc_isOpen: 'false'})

                const calls = mockedUseCommerceClientMessaging.mock.calls
                const widgetOptions = calls[calls.length - 1][1]

                // Persisted open-state wins over the cc_isOpen default.
                expect(widgetOptions.componentConfig.isOpen).toBe(true)
            })

            test('keeps the widget closed when the shopper closed it before navigating', () => {
                window.sessionStorage.setItem(COMMERCE_CLIENT_OPEN_STATE_KEY, 'false')

                // Even with cc_isOpen true, the shopper's explicit close must stick.
                renderCommerceClient({cc_isOpen: 'true'})

                const calls = mockedUseCommerceClientMessaging.mock.calls
                const widgetOptions = calls[calls.length - 1][1]

                expect(widgetOptions.componentConfig.isOpen).toBe(false)
            })

            test('falls back to cc_isOpen when nothing is persisted (fresh tab)', () => {
                renderCommerceClient({cc_isOpen: 'true'})

                const calls = mockedUseCommerceClientMessaging.mock.calls
                const widgetOptions = calls[calls.length - 1][1]

                expect(widgetOptions.componentConfig.isOpen).toBe(true)
            })
        })

        test('forwards cc_isDevelopment as the boolean isDevelopment widget option', () => {
            renderCommerceClient({cc_isDevelopment: 'true'})

            expect(mockedUseCommerceClientMessaging).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({isDevelopment: true})
            )
        })

        test('defaults isDevelopment to false when cc_isDevelopment is not set', () => {
            renderCommerceClient()

            expect(mockedUseCommerceClientMessaging).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({isDevelopment: false})
            )
        })

        test('defaults escalation to false and transcript to true in the widget options', () => {
            renderCommerceClient()

            expect(mockedUseCommerceClientMessaging).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    enableEscalationToAgent: false,
                    enableDownloadTranscript: true
                })
            )
        })

        test('forwards cc_enableEscalationToAgent as true when explicitly set', () => {
            renderCommerceClient({cc_enableEscalationToAgent: 'true'})

            expect(mockedUseCommerceClientMessaging).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({enableEscalationToAgent: true})
            )
        })

        test('forwards escalation and transcript toggles as booleans when set to false', () => {
            renderCommerceClient({
                cc_enableEscalationToAgent: 'false',
                cc_enableDownloadTranscript: 'false'
            })

            expect(mockedUseCommerceClientMessaging).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    enableEscalationToAgent: false,
                    enableDownloadTranscript: false
                })
            )
        })

        test('loads the Commerce Client bundle via useScript, resolving cc_cdnVersion to a CDN URL', () => {
            renderCommerceClient()

            expect(mockedUseScript).toHaveBeenCalledWith(
                `${COMMERCE_CLIENT_CDN_BASE_URL}/1.0.0/messaging.umd.js`
            )
        })

        test('loads an explicit commerceClientScriptSourceUrl override via useScript', () => {
            const overrideUrl =
                'https://www.shop.prd.tbdp.sfcc-store-internal.net/jscript/messaging.umd.js'
            renderCommerceClient({
                cc_cdnVersion: undefined,
                commerceClientScriptSourceUrl: overrideUrl
            })

            expect(mockedUseScript).toHaveBeenCalledWith(overrideUrl)
        })

        test('builds full-height side panel options by default (cc_dialogFullHeight defaults to true)', () => {
            renderCommerceClient({cc_dialogWidth: '500px'})

            expect(mockedUseCommerceClientMessaging).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    componentConfig: expect.objectContaining({
                        type: 'dialog',
                        options: expect.objectContaining({
                            dialogPosition: 'bottom-right',
                            dialogFullHeight: true,
                            dialogWidth: '500px'
                        })
                    })
                })
            )
        })

        test('forwards cc_widgetPosition as the dialogPosition', () => {
            renderCommerceClient({cc_widgetPosition: 'bottom-left'})

            const calls = mockedUseCommerceClientMessaging.mock.calls
            const widgetOptions = calls[calls.length - 1][1]

            expect(widgetOptions.componentConfig.options.dialogPosition).toBe('bottom-left')
        })

        test('does not apply full-height options when cc_dialogFullHeight is false', () => {
            renderCommerceClient({
                cc_dialogFullHeight: 'false',
                cc_displayType: 'modal',
                cc_widgetPosition: 'bottom-left'
            })

            const calls = mockedUseCommerceClientMessaging.mock.calls
            const widgetOptions = calls[calls.length - 1][1]

            expect(widgetOptions.componentConfig.type).toBe('modal')
            expect(widgetOptions.componentConfig.options).toEqual({dialogPosition: 'bottom-left'})
        })

        test('sends dialogFullHeight false explicitly so the widget default cannot win', () => {
            renderCommerceClient({cc_dialogFullHeight: 'false', cc_displayType: 'dialog'})

            const calls = mockedUseCommerceClientMessaging.mock.calls
            const widgetOptions = calls[calls.length - 1][1]

            expect(widgetOptions.componentConfig.options.dialogFullHeight).toBe(false)
        })

        test('omits dialog layout options for a modal widget', () => {
            renderCommerceClient({cc_dialogFullHeight: 'true', cc_displayType: 'modal'})

            const calls = mockedUseCommerceClientMessaging.mock.calls
            const widgetOptions = calls[calls.length - 1][1]

            expect(widgetOptions.componentConfig.options).toEqual({dialogPosition: 'bottom-right'})
        })
    })
})
