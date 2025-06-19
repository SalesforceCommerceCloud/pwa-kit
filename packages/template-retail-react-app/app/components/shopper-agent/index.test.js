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
    settings: jest.fn(),
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

        // Mock the window.embeddedservice_bootstrap object
        global.window.embeddedservice_bootstrap = mockEmbeddedService

        useScript.mockReturnValue({loaded: false, error: false})

        // Clear any existing scripts
        const scripts = document.querySelectorAll('script[data-status]')
        scripts.forEach((script) => script.remove())
    })

    afterEach(() => {
        // Clean up the window.embeddedservice_bootstrap mock
        delete global.window.embeddedservice_bootstrap
    })

    const defaultProps = {
        commerceAgentConfiguration: commerceAgentSettings,
        domainUrl: 'https://myorg.salesforce.com',
        basketId: '4a67cda5b1b9325a29207854c1',
        locale: 'en-US',
        basketDoneLoading: true
    }

    test('should render nothing when enableMiaw is false', () => {
        const props = {...defaultProps, enableMiaw: false}
        const {container} = render(<ShopperAgent {...props} />)

        expect(container.firstChild).toBeNull()
    })

    test('should render nothing when commerceAgent is not provided via an environment variable', () => {
        const commerceAgent = {enabled: 'false'}
        const props = {commerceAgentConfiguration: commerceAgent, enableMiaw: false}
        const {container} = render(<ShopperAgent {...props} />)

        expect(container.firstChild).toBeNull()
    })

    test('should render nothing when basketDoneLoading is false', () => {
        const props = {...defaultProps, basketDoneLoading: false}
        const {container} = render(<ShopperAgent {...props} />)

        expect(container.firstChild).toBeNull()
    })

    test('should not render anything when commerceAgenticEsdScriptSourceUrl is not provided', () => {
        const props = {...defaultProps, scriptUrl: null}
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
        // Verify settings were configured correctly
        expect(mockEmbeddedService.settings.language).toBe('en-US')
        expect(mockEmbeddedService.settings.disableStreamingResponses).toBe(true)

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

    test('should handle initialization error from useMiaw hook', () => {
        // Mock useMiaw to return an error
        const errorMessage = 'Initialization failed'
        useScript.mockReturnValue({loaded: true, error: true})
        mockEmbeddedService.init.mockImplementation(() => {
            throw new Error(errorMessage)
        })

        const {container} = render(<ShopperAgent {...defaultProps} />)

        // Component should not render anything when there's an error
        expect(container.firstChild).toBeNull()
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

        // Should not call init or createComponent again
        expect(mockEmbeddedService.init).not.toHaveBeenCalled()
    })

    test('should set prechat fields correctly on different events', async () => {
        useScript.mockReturnValue({loaded: true, error: false})
        render(<ShopperAgent {...defaultProps} />)

        // Test initial prechat fields set on ready event
        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingReady'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            DomainUrl: defaultProps.domainUrl,
            SiteId: commerceAgentSettings.siteId,
            Locale: defaultProps.locale,
            OrganizationId: commerceAgentSettings.commerceOrgId,
            UsId: 'test-usid',
            PwaKit: true
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
        const commerceAgentSettings = {...defaultProps.commerceAgent, enabled: 'false'}
        const props = {...defaultProps, commerceAgentConfiguration: commerceAgentSettings}

        render(<ShopperAgent {...props} />)

        // Component should not render anything when there's an error
        expect(useScript).not.toHaveBeenCalled()
    })

    test('should set the z-index of the embedded messaging frame to the sticky z-index + 1 when the window is maximized', async () => {
        const mockFrame = document.createElement('div')
        mockFrame.id = 'embeddedMessaging'
        mockFrame.style.zIndex = '0'

        // Store original querySelector
        const originalQuerySelector = document.querySelector

        // Mock querySelector to return our mock frame
        document.body.querySelector = jest.fn().mockImplementation((selector) => {
            if (selector === 'div.embedded-messaging iframe') {
                return mockFrame
            }
            return originalQuerySelector.call(document, selector)
        })

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
            scriptSourceUrl: 'https://test.script.com',
            scrt2Url: 'https://test.scrt.com',
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

        it('should remove event listeners when component unmounts', () => {
            // Render the component
            const {unmount} = render(
                <ShopperAgent
                    commerceAgentConfiguration={mockCommerceAgent}
                    domainUrl="https://test.domain.com"
                    basketId="test-basket-id"
                    locale="en-US"
                    basketDoneLoading={true}
                />
            )

            // Get the handler functions that were added
            const readyHandler = mockAddEventListener.mock.calls.find(
                (call) => call[0] === 'onEmbeddedMessagingReady'
            )[1]
            const maximizeHandler = mockAddEventListener.mock.calls.find(
                (call) => call[0] === 'onEmbeddedMessagingWindowMaximized'
            )[1]
            const buttonClickHandler = mockAddEventListener.mock.calls.find(
                (call) => call[0] === 'onEmbeddedMessagingButtonClicked'
            )[1]

            // Verify all event listeners were added
            expect(mockAddEventListener).toHaveBeenCalledTimes(3)
            expect(mockAddEventListener).toHaveBeenCalledWith(
                'onEmbeddedMessagingReady',
                readyHandler
            )
            expect(mockAddEventListener).toHaveBeenCalledWith(
                'onEmbeddedMessagingWindowMaximized',
                maximizeHandler
            )
            expect(mockAddEventListener).toHaveBeenCalledWith(
                'onEmbeddedMessagingButtonClicked',
                buttonClickHandler
            )

            // Unmount the component
            unmount()

            // Verify all event listeners were removed with the same handlers
            expect(mockRemoveEventListener).toHaveBeenCalledTimes(3)
            expect(mockRemoveEventListener).toHaveBeenCalledWith(
                'onEmbeddedMessagingReady',
                readyHandler
            )
            expect(mockRemoveEventListener).toHaveBeenCalledWith(
                'onEmbeddedMessagingWindowMaximized',
                maximizeHandler
            )
            expect(mockRemoveEventListener).toHaveBeenCalledWith(
                'onEmbeddedMessagingButtonClicked',
                buttonClickHandler
            )
        })

        it('should not add event listeners when component is disabled', () => {
            const disabledCommerceAgent = {
                ...mockCommerceAgent,
                enabled: 'false'
            }

            // Render the component with disabled commerce agent
            const {unmount} = render(
                <ShopperAgent
                    commerceAgentConfiguration={disabledCommerceAgent}
                    domainUrl="https://test.domain.com"
                    basketId="test-basket-id"
                    locale="en-US"
                    basketDoneLoading={true}
                />
            )

            // Verify no event listeners were added
            expect(mockAddEventListener).not.toHaveBeenCalled()

            // Unmount the component
            unmount()

            // Verify no event listeners were removed
            expect(mockRemoveEventListener).not.toHaveBeenCalled()
        })
    })
})
