/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render} from '@testing-library/react'
import '@testing-library/jest-dom'
import withMultiSite from './with-multi-site'
import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import {createUrlTemplate} from '../../utils/url'
import {resolveSiteFromUrl, resolveLocaleFromUrl} from '../../utils/site-utils'
import {useConfig} from '../../hooks/use-config'

// Mock dependencies
jest.mock('@salesforce/pwa-kit-react-sdk/ssr/universal/hooks', () => ({
    useServerContext: jest.fn()
}))
jest.mock('../../hooks/use-config', () => ({
    useConfig: jest.fn()
}))
jest.mock('../../utils/url', () => ({
    createUrlTemplate: jest.fn()
}))
jest.mock('../../utils/site-utils', () => ({
    resolveSiteFromUrl: jest.fn(),
    resolveLocaleFromUrl: jest.fn()
}))

const mockUseServerContext = useServerContext as jest.MockedFunction<typeof useServerContext>
const mockUseConfig = useConfig as jest.MockedFunction<typeof useConfig>
const mockCreateUrlTemplate = createUrlTemplate as jest.MockedFunction<typeof createUrlTemplate>
const mockResolveSiteFromUrl = resolveSiteFromUrl as jest.MockedFunction<typeof resolveSiteFromUrl>
const mockResolveLocaleFromUrl = resolveLocaleFromUrl as jest.MockedFunction<
    typeof resolveLocaleFromUrl
>

// Define a simple test component
const TestComponent: React.FC = () => <div data-testid="test-component">Test Component</div>

// Wrap the TestComponent with withMultiSite HOC
const WrappedComponent = withMultiSite(TestComponent)

describe('withMultiSite HOC', () => {
    beforeEach(() => {
        // Set up default mock values
        mockUseServerContext.mockReturnValue({
            req: {originalUrl: '/test-path'},
            res: {}
        })
        mockUseConfig.mockReturnValue({someConfig: 'value'})
        mockResolveSiteFromUrl.mockReturnValue({id: 'site-id', alias: 'site-alias'})
        mockResolveLocaleFromUrl.mockReturnValue({id: 'locale-id'})
        mockCreateUrlTemplate.mockReturnValue(jest.fn((path: string) => `/resolved-url${path}`))
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should render the wrapped component', () => {
        const {getByTestId} = render(<WrappedComponent />)
        expect(getByTestId('test-component')).toBeInTheDocument()
    })

    it('should use the req.originalUrl if available', () => {
        render(<WrappedComponent />)
        expect(mockResolveSiteFromUrl).toHaveBeenCalledWith('/test-path')
        expect(mockResolveLocaleFromUrl).toHaveBeenCalledWith('/test-path')
    })

    it('should fall back to window.location if req is undefined', () => {
        // Set up window location for test
        delete (global as any).window.location
        ;(global as any).window.location = {pathname: '/fallback-path', search: '?query=123'}
        mockUseServerContext.mockReturnValue({req: undefined})

        render(<WrappedComponent />)

        // Verify resolveSiteFromUrl and resolveLocaleFromUrl were called with fallback path
        expect(mockResolveSiteFromUrl).toHaveBeenCalledWith('/fallback-path?query=123')
        expect(mockResolveLocaleFromUrl).toHaveBeenCalledWith('/fallback-path?query=123')
    })

    it('should provide correct props to MultiSiteProvider', () => {
        const {getByTestId} = render(<WrappedComponent />)

        // Check if MultiSiteProvider was called with the resolved site, locale, and buildUrl
        expect(mockCreateUrlTemplate).toHaveBeenCalledWith(
            {someConfig: 'value'},
            'site-alias',
            'locale-id'
        )
        expect(getByTestId('test-component')).toBeInTheDocument()
    })
})
