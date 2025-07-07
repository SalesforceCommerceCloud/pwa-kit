/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, act} from '@testing-library/react'
import ShopperAgent from '@salesforce/retail-react-app/app/components/shopper-agent/index'
import useScript from '@salesforce/retail-react-app/app/hooks/use-script'

// Mock the embeddedservice_bootstrap object
const mockEmbeddedService = {
    init: jest.fn(),
    settings: {
        language: '',
        disableStreamingResponses: false
    },
    prechatAPI: {
        setHiddenPrechatFields: jest.fn()
    }
}

jest.mock('../../hooks/use-script', () => jest.fn().mockReturnValue({loaded: false, error: false}))

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useUsid: () => ({usid: 'test-usid'})
    }
})

jest.mock('@salesforce/retail-react-app/app/components/shared/ui', () => {
    const originalModule = jest.requireActual(
        '@salesforce/retail-react-app/app/components/shared/ui'
    )
    return {
        ...originalModule,
        useTheme: jest.fn().mockReturnValue({
            zIndices: {
                sticky: 1100
            }
        })
    }
})

const commerceAgentSettings = {
    enabled: 'true',
    askAgentOnSearch: 'true',
    embeddedServiceName: 'MIAW_Guided_Shopper_production',
    embeddedServiceEndpoint: 'https://myorg.salesforce.com/ESWMIAWGuidedShopper',
    scriptSourceUrl: 'https://myorg.salesforce.com/ESWMIAWGuidedShopper/assets/js/bootstrap.min.js',
    scrt2Url: 'https://myorg.salesforce.com-scrt.com',
    salesforceOrgId: 'mock_salesforce_org_id',
    commerceOrgId: 'mock_ecom_id',
    siteId: 'RefArchGlobal'
}

describe('ShopperAgent Component', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks()

        // Reset the mockEmbeddedService.init to not throw errors
        mockEmbeddedService.init.mockImplementation(() => {})

        // Mock the window.embeddedservice_bootstrap object
        global.window.embeddedservice_bootstrap = mockEmbeddedService

        useScript.mockReturnValue({loaded: false, error: false})

        // Clear any existing scripts
        const scripts = document.querySelectorAll('script[src]')
        scripts.forEach((script) => script.remove())
    })

    afterEach(() => {
        // Clean up the window.embeddedservice_bootstrap mock
        delete global.window.embeddedservice_bootstrap
    })

    const defaultProps = {
        commerceAgentConfiguration: commerceAgentSettings,
        basketId: '4a67cda5b1b9325a29207854c1',
        locale: 'en-US',
        basketDoneLoading: true
    }

    test('should render nothing when enabled is false', () => {
        const disabledSettings = {...commerceAgentSettings, enabled: 'false'}
        const props = {...defaultProps, commerceAgentConfiguration: disabledSettings}
        const {container} = render(<ShopperAgent {...props} />)

        expect(container.firstChild).toBeNull()
    })

    test('should render nothing when basketDoneLoading is false', () => {
        const props = {...defaultProps, basketDoneLoading: false}
        const {container} = render(<ShopperAgent {...props} />)

        expect(container.firstChild).toBeNull()
    })

    test('should not render anything when embeddedservice_bootstrap is not available', () => {
        // Temporarily remove the mock for this test
        const originalEmbeddedService = global.window.embeddedservice_bootstrap
        delete global.window.embeddedservice_bootstrap
        useScript.mockReturnValue({loaded: true, error: false})

        render(<ShopperAgent {...defaultProps} />)

        expect(mockEmbeddedService.init).not.toHaveBeenCalled()

        // Restore the mock
        global.window.embeddedservice_bootstrap = originalEmbeddedService
    })

    test('should initialize embedded service when all required props are provided', () => {
        useScript.mockReturnValue({loaded: true, error: false})
        render(<ShopperAgent {...defaultProps} />)
        // Verify embedded service initialization
        expect(mockEmbeddedService.init).toHaveBeenCalledWith(
            commerceAgentSettings.salesforceOrgId,
            commerceAgentSettings.embeddedServiceName,
            commerceAgentSettings.embeddedServiceEndpoint,
            {
                scrt2URL: commerceAgentSettings.scrt2Url
            }
        )
    })

    test('should handle initialization error gracefully', () => {
        // Mock console.error to avoid noise in test output
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
        const errorMessage = 'Initialization failed'
        useScript.mockReturnValue({loaded: true, error: false})
        mockEmbeddedService.init.mockImplementation(() => {
            throw new Error(errorMessage)
        })

        const {container} = render(<ShopperAgent {...defaultProps} />)

        // Component should still render (error is caught in initEmbeddedMessaging)
        expect(container.firstChild).toBeNull()

        consoleSpy.mockRestore()
    })

    test('should not reinitialize embedded service when already initialized', () => {
        // First render
        const scriptLoadStatus = {loaded: true, error: false}
        useScript.mockReturnValue(scriptLoadStatus)
        const {rerender} = render(<ShopperAgent {...defaultProps} />)

        expect(mockEmbeddedService.init).toHaveBeenCalled()

        // Reset mock call counts
        jest.clearAllMocks()

        useScript.mockReturnValue(scriptLoadStatus)

        // Re-render with same props
        rerender(<ShopperAgent {...defaultProps} />)

        // Should not call init again
        expect(mockEmbeddedService.init).not.toHaveBeenCalled()
    })

    test('should reinitialize when commerce agent configuration changes', () => {
        // First render
        useScript.mockReturnValue({loaded: true, error: false})
        const {rerender} = render(<ShopperAgent {...defaultProps} />)

        expect(mockEmbeddedService.init).toHaveBeenCalledTimes(1)

        // Reset mock call counts
        jest.clearAllMocks()

        // Re-render with different commerce agent configuration
        const newCommerceAgentSettings = {
            ...commerceAgentSettings,
            salesforceOrgId: 'new_salesforce_org_id',
            embeddedServiceName: 'NewService'
        }
        const newProps = {
            ...defaultProps,
            commerceAgentConfiguration: newCommerceAgentSettings
        }

        rerender(<ShopperAgent {...newProps} />)

        // Should call init again with new configuration
        expect(mockEmbeddedService.init).toHaveBeenCalledWith(
            newCommerceAgentSettings.salesforceOrgId,
            newCommerceAgentSettings.embeddedServiceName,
            newCommerceAgentSettings.embeddedServiceEndpoint,
            {
                scrt2URL: newCommerceAgentSettings.scrt2Url
            }
        )
    })

    test('should set prechat fields correctly on different events', async () => {
        useScript.mockReturnValue({loaded: true, error: false})
        render(<ShopperAgent {...defaultProps} />)

        // Test initial prechat fields set on ready event
        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingReady'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            SiteId: commerceAgentSettings.siteId,
            Locale: defaultProps.locale,
            OrganizationId: commerceAgentSettings.commerceOrgId,
            UsId: 'test-usid',
            IsCartMgmtSupported: 'true'
        })

        // Reset mock to test button click event
        mockEmbeddedService.prechatAPI.setHiddenPrechatFields.mockClear()

        // Test BasketId update when button is clicked
        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingButtonClicked'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            BasketId: defaultProps.basketId
        })
    })

    test('should not render when commerce agent settings are invalid', () => {
        const invalidCommerceAgentSettings = {
            enabled: 'true',
            // Missing required fields
            embeddedServiceName: 'test-service',
            scriptSourceUrl: 'https://test.com/script.js'
        }
        const props = {
            ...defaultProps,
            commerceAgentConfiguration: invalidCommerceAgentSettings
        }

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
        const {container} = render(<ShopperAgent {...props} />)

        // Should log error about invalid settings
        expect(consoleSpy).toHaveBeenCalledWith('Invalid commerce agent settings.')

        // Component should not render anything
        expect(container.firstChild).toBeNull()

        consoleSpy.mockRestore()
    })

    test('should not load the script when the commerceAgent is disabled', () => {
        const disabledSettings = {...commerceAgentSettings, enabled: 'false'}
        const props = {...defaultProps, commerceAgentConfiguration: disabledSettings}

        render(<ShopperAgent {...props} />)

        // Component should not render anything when disabled
        expect(useScript).not.toHaveBeenCalled()
    })

    test('should not render when script URL is from untrusted domain', () => {
        const untrustedSettings = {
            ...commerceAgentSettings,
            scriptSourceUrl: 'https://malicious-site.com/script.js'
        }
        const props = {
            ...defaultProps,
            commerceAgentConfiguration: untrustedSettings
        }

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
        const {container} = render(<ShopperAgent {...props} />)

        // Should log error about untrusted domain
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Script URL must be from a trusted Salesforce domain.')
        )

        // Component should not render anything
        expect(container.firstChild).toBeNull()

        consoleSpy.mockRestore()
    })

    test('should render when script URL is from trusted salesforce.com domain', () => {
        const trustedSettings = {
            ...commerceAgentSettings,
            scriptSourceUrl:
                'https://myorg.salesforce.com/ESWMIAWGuidedShopper/assets/js/bootstrap.min.js'
        }
        const props = {
            ...defaultProps,
            commerceAgentConfiguration: trustedSettings,
            basketDoneLoading: true
        }

        useScript.mockReturnValue({loaded: true, error: false})
        render(<ShopperAgent {...props} />)

        // Component should initialize when domain is trusted
        expect(mockEmbeddedService.init).toHaveBeenCalled()
    })

    test('should render when script URL is from trusted salesforce-scrt.com domain', () => {
        const trustedSettings = {
            ...commerceAgentSettings,
            scriptSourceUrl: 'https://myorg.salesforce-scrt.com/script.js'
        }
        const props = {
            ...defaultProps,
            commerceAgentConfiguration: trustedSettings,
            basketDoneLoading: true
        }

        useScript.mockReturnValue({loaded: true, error: false})
        render(<ShopperAgent {...props} />)

        // Component should initialize when domain is trusted
        expect(mockEmbeddedService.init).toHaveBeenCalled()
    })

    test('should render when script URL is from trusted pc-rnd.salesforce-scrt.com domain', () => {
        const trustedSettings = {
            ...commerceAgentSettings,
            scriptSourceUrl: 'https://myorg.pc-rnd.salesforce-scrt.com/script.js'
        }
        const props = {
            ...defaultProps,
            commerceAgentConfiguration: trustedSettings,
            basketDoneLoading: true
        }

        useScript.mockReturnValue({loaded: true, error: false})
        render(<ShopperAgent {...props} />)

        // Component should initialize when domain is trusted
        expect(mockEmbeddedService.init).toHaveBeenCalled()
    })

    test('should render when script URL is from trusted pc-rnd.site.com domain', () => {
        const trustedSettings = {
            ...commerceAgentSettings,
            scriptSourceUrl: 'https://orgfarm-1645fa246c.test1.my.pc-rnd.site.com/script.js'
        }
        const props = {
            ...defaultProps,
            commerceAgentConfiguration: trustedSettings,
            basketDoneLoading: true
        }

        useScript.mockReturnValue({loaded: true, error: false})
        render(<ShopperAgent {...props} />)

        // Component should initialize when domain is trusted
        expect(mockEmbeddedService.init).toHaveBeenCalled()
    })

    test('should not render when script URL is invalid', () => {
        const invalidSettings = {
            ...commerceAgentSettings,
            scriptSourceUrl: 'not-a-valid-url'
        }
        const props = {
            ...defaultProps,
            commerceAgentConfiguration: invalidSettings
        }

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
        const {container} = render(<ShopperAgent {...props} />)

        // Should log error about untrusted domain
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Script URL must be from a trusted Salesforce domain.')
        )

        // Component should not render anything
        expect(container.firstChild).toBeNull()

        consoleSpy.mockRestore()
    })

    test('should not render when script URL has subdomain of untrusted domain', () => {
        const untrustedSettings = {
            ...commerceAgentSettings,
            scriptSourceUrl: 'https://subdomain.malicious-site.com/script.js'
        }
        const props = {
            ...defaultProps,
            commerceAgentConfiguration: untrustedSettings
        }

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
        const {container} = render(<ShopperAgent {...props} />)

        // Should log error about untrusted domain
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Script URL must be from a trusted Salesforce domain.')
        )

        // Component should not render anything
        expect(container.firstChild).toBeNull()

        consoleSpy.mockRestore()
    })

    test('should set the z-index of the embedded messaging frame to the sticky z-index + 1 when the window is maximized', async () => {
        const mockFrame = document.createElement('div')
        mockFrame.style.zIndex = '0'

        // Store original querySelector
        const originalQuerySelector = document.body.querySelector

        // Mock querySelector to return our mock frame
        document.body.querySelector = jest.fn().mockImplementation((selector) => {
            if (selector === 'div.embedded-messaging iframe') {
                return mockFrame
            }
            return originalQuerySelector.call(document, selector)
        })

        useScript.mockReturnValue({loaded: true, error: false})
        render(<ShopperAgent {...defaultProps} />)

        // Simulate window maximize
        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingWindowMaximized'))
        })

        // Verify z-index was updated
        expect(mockFrame.style.zIndex).toBe('1101') // sticky (1100) + 1

        // Restore original querySelector
        document.body.querySelector = originalQuerySelector
    })

    test('should update prechat fields when commerce agent configuration changes', async () => {
        useScript.mockReturnValue({loaded: true, error: false})
        const {rerender} = render(<ShopperAgent {...defaultProps} />)

        // Trigger initial prechat fields setup
        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingReady'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            SiteId: commerceAgentSettings.siteId,
            Locale: defaultProps.locale,
            OrganizationId: commerceAgentSettings.commerceOrgId,
            UsId: 'test-usid',
            IsCartMgmtSupported: 'true'
        })

        // Reset mock
        mockEmbeddedService.prechatAPI.setHiddenPrechatFields.mockClear()

        // Re-render with different configuration
        const newCommerceAgentSettings = {
            ...commerceAgentSettings,
            siteId: 'NewSiteId',
            commerceOrgId: 'new_commerce_org_id'
        }
        const newProps = {
            ...defaultProps,
            commerceAgentConfiguration: newCommerceAgentSettings
        }

        rerender(<ShopperAgent {...newProps} />)

        // Trigger prechat fields setup with new configuration
        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingReady'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            SiteId: newCommerceAgentSettings.siteId,
            Locale: defaultProps.locale,
            OrganizationId: newCommerceAgentSettings.commerceOrgId,
            UsId: 'test-usid',
            IsCartMgmtSupported: 'true'
        })
    })

    describe('Event Listener Cleanup', () => {
        let originalAddEventListener
        let originalRemoveEventListener
        const mockAddEventListener = jest.fn()
        const mockRemoveEventListener = jest.fn()

        const mockCommerceAgent = {
            enabled: 'true',
            askAgentOnSearch: 'true',
            embeddedServiceName: 'TestService',
            embeddedServiceEndpoint: 'https://test.endpoint.com',
            scriptSourceUrl:
                'https://myorg.salesforce.com/ESWMIAWGuidedShopper/assets/js/bootstrap.min.js',
            scrt2Url: 'https://myorg.salesforce.com-scrt.com',
            salesforceOrgId: 'test-org-id',
            commerceOrgId: 'test-commerce-id',
            siteId: 'test-site-id'
        }

        beforeEach(() => {
            originalAddEventListener = window.addEventListener
            originalRemoveEventListener = window.removeEventListener
            window.addEventListener = mockAddEventListener
            window.removeEventListener = mockRemoveEventListener
        })

        afterEach(() => {
            window.addEventListener = originalAddEventListener
            window.removeEventListener = originalRemoveEventListener
        })

        test('should remove event listeners when component unmounts', () => {
            useScript.mockReturnValue({loaded: true, error: false})
            const props = {
                ...defaultProps,
                commerceAgentConfiguration: mockCommerceAgent,
                basketDoneLoading: true
            }

            const {unmount} = render(<ShopperAgent {...props} />)

            // Verify event listeners were added
            expect(mockAddEventListener).toHaveBeenCalledWith(
                'onEmbeddedMessagingReady',
                expect.any(Function)
            )
            expect(mockAddEventListener).toHaveBeenCalledWith(
                'onEmbeddedMessagingWindowMaximized',
                expect.any(Function)
            )
            expect(mockAddEventListener).toHaveBeenCalledWith(
                'onEmbeddedMessagingButtonClicked',
                expect.any(Function)
            )

            // Unmount the component
            unmount()

            // Verify event listeners were removed
            expect(mockRemoveEventListener).toHaveBeenCalledWith(
                'onEmbeddedMessagingReady',
                expect.any(Function)
            )
            expect(mockRemoveEventListener).toHaveBeenCalledWith(
                'onEmbeddedMessagingWindowMaximized',
                expect.any(Function)
            )
            expect(mockRemoveEventListener).toHaveBeenCalledWith(
                'onEmbeddedMessagingButtonClicked',
                expect.any(Function)
            )
        })

        test('should not add event listeners when component is disabled', () => {
            const disabledSettings = {...mockCommerceAgent, enabled: 'false'}
            const props = {
                ...defaultProps,
                commerceAgentConfiguration: disabledSettings
            }

            render(<ShopperAgent {...props} />)

            // Verify no event listeners were added
            expect(mockAddEventListener).not.toHaveBeenCalled()
        })
    })
})
