/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen} from '@testing-library/react'
import {withOptionalCommerceSdkReactProvider} from './with-optional-commerce-sdk-react-provider'
import PropTypes from 'prop-types'

jest.mock('@salesforce/commerce-sdk-react', () => ({
    useCommerceApi: jest.fn(),
    // eslint-disable-next-line react/prop-types
    CommerceApiProvider: ({children}) => {
        return <div data-testid="commerce-provider">{children}</div>
    }
}))

jest.mock('@salesforce/pwa-kit-react-sdk/utils/url', () => ({
    getAppOrigin: jest.fn(() => 'https://example.com')
}))

describe('withOptionalCommerceSdkReactProvider', () => {
    const TestComponent = () => <div>Test Component</div>
    const mockConfig = {
        commerceApi: {
            parameters: {
                shortCode: 'test',
                clientId: 'test-client',
                organizationId: 'test-org',
                siteId: 'test-site',
                locale: 'en-US',
                currency: 'USD'
            },
            proxyPath: '/api'
        }
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('wraps component with CommerceApiProvider when no provider exists', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const {useCommerceApi} = require('@salesforce/commerce-sdk-react')
        useCommerceApi.mockImplementation(() => {
            throw new Error('No provider')
        })

        const WrappedComponent = withOptionalCommerceSdkReactProvider(TestComponent, mockConfig)
        const {container} = render(<WrappedComponent />)

        expect(screen.getByTestId('commerce-provider')).toBeTruthy()
        expect(screen.getByText('Test Component')).toBeTruthy()
    })

    it('does not wrap component when provider already exists', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const {useCommerceApi} = require('@salesforce/commerce-sdk-react')
        useCommerceApi.mockReturnValue({ShopperProducts: {}, ShopperBaskets: {}})

        const WrappedComponent = withOptionalCommerceSdkReactProvider(TestComponent, mockConfig)
        const {container} = render(<WrappedComponent />)

        expect(container.querySelector('[data-testid="commerce-provider"]')).toBeNull()
        expect(screen.getByText('Test Component')).toBeTruthy()
    })

    it('passes props to wrapped component', () => {
        const TestComponentWithProps = ({testProp}) => <div>{testProp}</div>
        TestComponentWithProps.propTypes = {
            testProp: PropTypes.string
        }

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const {useCommerceApi} = require('@salesforce/commerce-sdk-react')
        useCommerceApi.mockImplementation(() => {
            throw new Error('No provider')
        })

        const WrappedComponent = withOptionalCommerceSdkReactProvider(
            TestComponentWithProps,
            mockConfig
        )
        render(<WrappedComponent testProp="test value" />)

        expect(screen.getByText('test value')).toBeTruthy()
    })

    it('renders wrapped component without provider when config is missing', () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const {useCommerceApi} = require('@salesforce/commerce-sdk-react')
        useCommerceApi.mockImplementation(() => {
            throw new Error('No provider')
        })

        const invalidConfig = {}
        const WrappedComponent = withOptionalCommerceSdkReactProvider(TestComponent, invalidConfig)
        const {container} = render(<WrappedComponent />)

        expect(container.querySelector('[data-testid="commerce-provider"]')).toBeNull()
        expect(screen.getByText('Test Component')).toBeTruthy()
    })
})
