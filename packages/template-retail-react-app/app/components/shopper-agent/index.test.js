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

// Mock useScript hook
jest.mock('@salesforce/retail-react-app/app/hooks/use-script', () =>
    jest.fn().mockReturnValue({loaded: false, error: false})
)

// Mock commerce-sdk-react
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useUsid: () => ({usid: 'test-usid'})
    }
})

// Mock UI components
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
        jest.clearAllMocks()
        global.window.embeddedservice_bootstrap = mockEmbeddedService
        useScript.mockReturnValue({loaded: false, error: false})
        const scripts = document.querySelectorAll('script[data-status]')
        scripts.forEach(script => script.remove())
    })

    afterEach(() => {
        delete global.window.embeddedservice_bootstrap
        jest.clearAllMocks()
    })

    const defaultProps = {
        commerceAgentConfiguration: commerceAgentSettings,
        domainUrl: 'https://myorg.salesforce.com',
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

    test('should not render when embeddedservice_bootstrap is not available', () => {
        const originalEmbeddedService = global.window.embeddedservice_bootstrap
        delete global.window.embeddedservice_bootstrap
        useScript.mockReturnValue({loaded: true, error: false})

        render(<ShopperAgent {...defaultProps} />)
        expect(mockEmbeddedService.init).not.toHaveBeenCalled()

        global.window.embeddedservice_bootstrap = originalEmbeddedService
    })

    test('should initialize embedded service with correct settings', () => {
        useScript.mockReturnValue({loaded: true, error: false})
        render(<ShopperAgent {...defaultProps} />)

        expect(mockEmbeddedService.settings.language).toBe('en-US')
        expect(mockEmbeddedService.settings.disableStreamingResponses).toBe(true)
        expect(mockEmbeddedService.init).toHaveBeenCalledWith(
            commerceAgentSettings.salesforceOrgId,
            commerceAgentSettings.embeddedServiceName,
            commerceAgentSettings.embeddedServiceEndpoint,
            {scrt2URL: commerceAgentSettings.scrt2Url}
        )
    })

    test('should handle initialization error', () => {
        const errorMessage = 'Initialization failed'
        useScript.mockReturnValue({loaded: true, error: false})
        mockEmbeddedService.init.mockImplementation(() => {
            throw new Error(errorMessage)
        })

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
        const {container} = render(<ShopperAgent {...defaultProps} />)
        
        expect(container.firstChild).toBeNull()
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'Error initializing Embedded Messaging: ',
            expect.any(Error)
        )

        consoleErrorSpy.mockRestore()
    })

    test('should not reinitialize when already initialized', () => {
        const scriptLoadStatus = {loaded: true, error: false}
        useScript.mockReturnValue(scriptLoadStatus)
        const {rerender} = render(<ShopperAgent {...defaultProps} />)

        expect(mockEmbeddedService.init).toHaveBeenCalled()
        jest.clearAllMocks()

        useScript.mockReturnValue(scriptLoadStatus)
        rerender(<ShopperAgent {...defaultProps} />)
        expect(mockEmbeddedService.init).not.toHaveBeenCalled()
    })

    test('should set prechat fields on events', async () => {
        useScript.mockReturnValue({loaded: true, error: false})
        render(<ShopperAgent {...defaultProps} />)

        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingReady'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            DomainUrl: defaultProps.domainUrl,
            SiteId: commerceAgentSettings.siteId,
            Locale: defaultProps.locale,
            OrganizationId: commerceAgentSettings.commerceOrgId,
            UsId: 'test-usid',
            SfraSite: false
        })

        mockEmbeddedService.prechatAPI.setHiddenPrechatFields.mockClear()

        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingButtonClicked'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            BasketId: defaultProps.basketId
        })
    })

    test('should not render with invalid settings', () => {
        const invalidSettings = {
            ...commerceAgentSettings,
            enabled: true,
            askAgentOnSearch: null,
            embeddedServiceName: undefined,
            embeddedServiceEndpoint: 123,
            scriptSourceUrl: {},
            scrt2Url: [],
            salesforceOrgId: false,
            commerceOrgId: () => {},
            siteId: 0
        }

        const props = {...defaultProps, commerceAgentConfiguration: invalidSettings}
        const {container} = render(<ShopperAgent {...props} />)

        expect(container.firstChild).toBeNull()
        expect(mockEmbeddedService.init).not.toHaveBeenCalled()
    })

    test('should handle missing settings', () => {
        const originalSettings = mockEmbeddedService.settings
        delete mockEmbeddedService.settings
        useScript.mockReturnValue({loaded: true, error: false})

        render(<ShopperAgent {...defaultProps} />)
        expect(mockEmbeddedService.init).not.toHaveBeenCalled()

        mockEmbeddedService.settings = originalSettings
    })

    test('should update z-index on maximize', async () => {
        useScript.mockReturnValue({loaded: true, error: false})
        render(<ShopperAgent {...defaultProps} />)

        const mockFrame = document.createElement('iframe')
        const mockDiv = document.createElement('div')
        mockDiv.className = 'embedded-messaging'
        mockDiv.appendChild(mockFrame)
        document.body.appendChild(mockDiv)

        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingWindowMaximized'))
        })

        expect(mockFrame.style.zIndex).toBe('1101')
        document.body.removeChild(mockDiv)
    })

    test('should cleanup event listeners', () => {
        useScript.mockReturnValue({loaded: true, error: false})
        const {unmount} = render(<ShopperAgent {...defaultProps} />)
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

        unmount()

        expect(removeEventListenerSpy).toHaveBeenCalledWith(
            'onEmbeddedMessagingReady',
            expect.any(Function)
        )
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
            'onEmbeddedMessagingWindowMaximized',
            expect.any(Function)
        )
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
            'onEmbeddedMessagingButtonClicked',
            expect.any(Function)
        )

        removeEventListenerSpy.mockRestore()
    })

    test('should handle basketId changes', async () => {
        useScript.mockReturnValue({loaded: true, error: false})
        const {rerender} = render(<ShopperAgent {...defaultProps} />)

        mockEmbeddedService.prechatAPI.setHiddenPrechatFields.mockClear()

        const newBasketId = 'new-basket-id'
        rerender(<ShopperAgent {...defaultProps} basketId={newBasketId} />)

        await act(async () => {
            window.dispatchEvent(new Event('onEmbeddedMessagingButtonClicked'))
        })

        expect(mockEmbeddedService.prechatAPI.setHiddenPrechatFields).toHaveBeenCalledWith({
            BasketId: newBasketId
        })
    })
})
