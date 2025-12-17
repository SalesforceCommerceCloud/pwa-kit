/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render} from '@testing-library/react'
import {GoogleAPIProvider} from '@salesforce/retail-react-app/app/pages/checkout/util/google-api-provider'

// Mock the dependencies
const mockUseCheckout = jest.fn()
const mockGetConfig = jest.fn()

jest.mock('@salesforce/retail-react-app/app/pages/checkout/util/checkout-context', () => ({
    useCheckout: () => mockUseCheckout()
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: () => mockGetConfig()
}))

jest.mock('@vis.gl/react-google-maps', () => ({
    // eslint-disable-next-line react/prop-types
    APIProvider: ({children, apiKey}) => (
        <div data-testid="api-provider" data-api-key={apiKey}>
            {children}
        </div>
    )
}))

describe('GoogleAPIProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    afterEach(() => {
        jest.resetModules()
    })

    test('should render children directly when platform provided key is not present and no custom key', () => {
        mockUseCheckout.mockReturnValue({
            configurations: {
                configurations: []
            }
        })

        mockGetConfig.mockReturnValue({
            app: {}
        })

        const {getByTestId, queryByTestId} = render(
            <GoogleAPIProvider>
                <div data-testid="test-child">Test Child</div>
            </GoogleAPIProvider>
        )

        expect(getByTestId('test-child')).toBeInTheDocument()
        expect(queryByTestId('api-provider')).not.toBeInTheDocument()
    })

    test('should render children directly when configurations is undefined and no custom key', () => {
        mockUseCheckout.mockReturnValue({
            configurations: undefined
        })

        mockGetConfig.mockReturnValue({
            app: {}
        })

        const {getByTestId, queryByTestId} = render(
            <GoogleAPIProvider>
                <div data-testid="test-child">Test Child</div>
            </GoogleAPIProvider>
        )

        expect(getByTestId('test-child')).toBeInTheDocument()
        expect(queryByTestId('api-provider')).not.toBeInTheDocument()
    })

    test('should render children directly when configurations is null and no custom key', () => {
        mockUseCheckout.mockReturnValue({
            configurations: null
        })

        mockGetConfig.mockReturnValue({
            app: {}
        })

        const {getByTestId, queryByTestId} = render(
            <GoogleAPIProvider>
                <div data-testid="test-child">Test Child</div>
            </GoogleAPIProvider>
        )

        expect(getByTestId('test-child')).toBeInTheDocument()
        expect(queryByTestId('api-provider')).not.toBeInTheDocument()
    })

    test('should wrap children in APIProvider when platform provided key is available and no custom key is configured', () => {
        mockUseCheckout.mockReturnValue({
            configurations: {
                configurations: [
                    {
                        id: 'gcp',
                        value: 'platform-provided-key'
                    }
                ]
            }
        })

        mockGetConfig.mockReturnValue({
            app: {}
        })

        const {getByTestId} = render(
            <GoogleAPIProvider>
                <div data-testid="test-child">Test Child</div>
            </GoogleAPIProvider>
        )

        const apiProvider = getByTestId('api-provider')
        expect(apiProvider).toBeInTheDocument()
        expect(apiProvider).toHaveAttribute('data-api-key', 'platform-provided-key')
        expect(getByTestId('test-child')).toBeInTheDocument()
    })

    test('should wrap children in APIProvider when platform provided key is available and custom key is not configured', () => {
        mockUseCheckout.mockReturnValue({
            configurations: {
                configurations: [
                    {
                        id: 'gcp',
                        value: 'platform-provided-key'
                    }
                ]
            }
        })

        mockGetConfig.mockReturnValue({
            app: {}
        })

        const {getByTestId} = render(
            <GoogleAPIProvider>
                <div data-testid="test-child">Test Child</div>
            </GoogleAPIProvider>
        )

        const apiProvider = getByTestId('api-provider')
        expect(apiProvider).toBeInTheDocument()
        expect(apiProvider).toHaveAttribute('data-api-key', 'platform-provided-key')
        expect(getByTestId('test-child')).toBeInTheDocument()
    })

    test('should wrap children in APIProvider with platform key when custom key is empty string', () => {
        mockUseCheckout.mockReturnValue({
            configurations: {
                configurations: [
                    {
                        id: 'gcp',
                        value: 'platform-provided-key'
                    }
                ]
            }
        })

        mockGetConfig.mockReturnValue({
            app: {
                googleCloudAPI: {
                    apiKey: ''
                }
            }
        })

        const {getByTestId} = render(
            <GoogleAPIProvider>
                <div data-testid="test-child">Test Child</div>
            </GoogleAPIProvider>
        )

        const apiProvider = getByTestId('api-provider')
        expect(apiProvider).toBeInTheDocument()
        expect(apiProvider).toHaveAttribute('data-api-key', 'platform-provided-key')
        expect(getByTestId('test-child')).toBeInTheDocument()
    })

    test('should wrap children in APIProvider with platform key when custom key is null', () => {
        mockUseCheckout.mockReturnValue({
            configurations: {
                configurations: [
                    {
                        id: 'gcp',
                        value: 'platform-provided-key'
                    }
                ]
            }
        })

        mockGetConfig.mockReturnValue({
            app: {
                googleCloudAPI: {
                    apiKey: null
                }
            }
        })

        const {getByTestId} = render(
            <GoogleAPIProvider>
                <div data-testid="test-child">Test Child</div>
            </GoogleAPIProvider>
        )

        const apiProvider = getByTestId('api-provider')
        expect(apiProvider).toBeInTheDocument()
        expect(apiProvider).toHaveAttribute('data-api-key', 'platform-provided-key')
        expect(getByTestId('test-child')).toBeInTheDocument()
    })

    test('should wrap children in APIProvider with platform key when custom key is undefined', () => {
        mockUseCheckout.mockReturnValue({
            configurations: {
                configurations: [
                    {
                        id: 'gcp',
                        value: 'platform-provided-key'
                    }
                ]
            }
        })

        mockGetConfig.mockReturnValue({
            app: {
                googleCloudAPI: {}
            }
        })

        const {getByTestId} = render(
            <GoogleAPIProvider>
                <div data-testid="test-child">Test Child</div>
            </GoogleAPIProvider>
        )

        const apiProvider = getByTestId('api-provider')
        expect(apiProvider).toBeInTheDocument()
        expect(apiProvider).toHaveAttribute('data-api-key', 'platform-provided-key')
        expect(getByTestId('test-child')).toBeInTheDocument()
    })

    test('should wrap children in APIProvider with custom key when custom key is configured', () => {
        mockUseCheckout.mockReturnValue({
            configurations: {
                configurations: [
                    {
                        id: 'gcp',
                        value: 'platform-provided-key'
                    }
                ]
            }
        })

        mockGetConfig.mockReturnValue({
            app: {
                googleCloudAPI: {
                    apiKey: 'custom-api-key'
                }
            }
        })

        const {getByTestId} = render(
            <GoogleAPIProvider>
                <div data-testid="test-child">Test Child</div>
            </GoogleAPIProvider>
        )

        const apiProvider = getByTestId('api-provider')
        expect(apiProvider).toBeInTheDocument()
        expect(apiProvider).toHaveAttribute('data-api-key', 'custom-api-key')
        expect(getByTestId('test-child')).toBeInTheDocument()
    })

    test('should wrap children in APIProvider with custom key when custom key is configured and platform key is not present', () => {
        mockUseCheckout.mockReturnValue({
            configurations: {
                configurations: []
            }
        })

        mockGetConfig.mockReturnValue({
            app: {
                googleCloudAPI: {
                    apiKey: 'custom-api-key'
                }
            }
        })

        const {getByTestId} = render(
            <GoogleAPIProvider>
                <div data-testid="test-child">Test Child</div>
            </GoogleAPIProvider>
        )

        const apiProvider = getByTestId('api-provider')
        expect(apiProvider).toBeInTheDocument()
        expect(apiProvider).toHaveAttribute('data-api-key', 'custom-api-key')
        expect(getByTestId('test-child')).toBeInTheDocument()
    })

    test('should wrap children in APIProvider with custom key when custom key is configured and configurations is undefined', () => {
        mockUseCheckout.mockReturnValue({
            configurations: undefined
        })

        mockGetConfig.mockReturnValue({
            app: {
                googleCloudAPI: {
                    apiKey: 'custom-api-key'
                }
            }
        })

        const {getByTestId} = render(
            <GoogleAPIProvider>
                <div data-testid="test-child">Test Child</div>
            </GoogleAPIProvider>
        )

        const apiProvider = getByTestId('api-provider')
        expect(apiProvider).toBeInTheDocument()
        expect(apiProvider).toHaveAttribute('data-api-key', 'custom-api-key')
        expect(getByTestId('test-child')).toBeInTheDocument()
    })

    test('should wrap children in APIProvider with custom key when custom key is configured and configurations is null', () => {
        mockUseCheckout.mockReturnValue({
            configurations: null
        })

        mockGetConfig.mockReturnValue({
            app: {
                googleCloudAPI: {
                    apiKey: 'custom-api-key'
                }
            }
        })

        const {getByTestId} = render(
            <GoogleAPIProvider>
                <div data-testid="test-child">Test Child</div>
            </GoogleAPIProvider>
        )

        const apiProvider = getByTestId('api-provider')
        expect(apiProvider).toBeInTheDocument()
        expect(apiProvider).toHaveAttribute('data-api-key', 'custom-api-key')
        expect(getByTestId('test-child')).toBeInTheDocument()
    })

    test('should handle multiple configurations and find the correct gcp one', () => {
        mockUseCheckout.mockReturnValue({
            configurations: {
                configurations: [
                    {
                        id: 'other-config',
                        value: 'other-value'
                    },
                    {
                        id: 'gcp',
                        value: 'platform-provided-key'
                    },
                    {
                        id: 'another-config',
                        value: 'another-value'
                    }
                ]
            }
        })

        mockGetConfig.mockReturnValue({
            app: {}
        })

        const {getByTestId} = render(
            <GoogleAPIProvider>
                <div data-testid="test-child">Test Child</div>
            </GoogleAPIProvider>
        )

        const apiProvider = getByTestId('api-provider')
        expect(apiProvider).toBeInTheDocument()
        expect(apiProvider).toHaveAttribute('data-api-key', 'platform-provided-key')
        expect(getByTestId('test-child')).toBeInTheDocument()
    })
})
