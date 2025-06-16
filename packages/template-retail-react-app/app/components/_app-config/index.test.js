/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render} from '@testing-library/react'
import AppConfig from './index.jsx'
// import {CommerceAPIProvider} from '../../commerce-api/contexts'

// Mock the theme module
jest.mock('../../theme', () => ({
    __esModule: true,
    default: {
        colors: {},
        fonts: {},
        // Add any other theme properties that might be used
    }
}))

// Mock the required dependencies
jest.mock('@chakra-ui/react', () => ({
    ChakraProvider: ({children}) => <div data-testid="chakra-provider">{children}</div>,
    extendTheme: () => ({}) // Add mock for extendTheme
}))

jest.mock('../../commerce-api/contexts', () => ({
    CommerceAPIProvider: ({children}) => <div data-testid="commerce-api-provider">{children}</div>,
    CustomerProvider: ({children}) => <div data-testid="customer-provider">{children}</div>,
    BasketProvider: ({children}) => <div data-testid="basket-provider">{children}</div>,
    CustomerProductListsProvider: ({children}) => (
        <div data-testid="customer-product-lists-provider">{children}</div>
    )
}))

jest.mock('../../contexts', () => ({
    MultiSiteProvider: ({children}) => <div data-testid="multi-site-provider">{children}</div>
}))

// Mock other required modules
jest.mock('focus-visible/dist/focus-visible', () => ({}))
jest.mock('pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: () => ({
        app: {
            commerceAPI: {},
            einsteinAPI: {},
            sites: [
                {
                    id: 'RefArch',
                    alias: 'refarch',
                    l10n: {
                        supportedLocales: ['en-US', 'fr-FR'],
                        defaultLocale: 'en-US'
                    }
                }
            ]
        }
    })
}))

// Mock URL utilities
jest.mock('pwa-kit-react-sdk/utils/url', () => ({
    getAppOrigin: () => 'http://localhost:3000',
    createUrlTemplate: () => () => 'http://localhost:3000'
}))

// Mock site and locale utilities
jest.mock('../../utils/site-utils', () => ({
    resolveSiteFromUrl: () => ({
        id: 'RefArch',
        alias: 'refarch',
        l10n: {
            supportedLocales: ['en-US', 'fr-FR'],
            defaultLocale: 'en-US'
        }
    })
}))

jest.mock('../../utils/utils', () => ({
    resolveLocaleFromUrl: () => ({
        id: 'en-US',
        preferredCurrency: 'USD'
    }),
    isServer: () => false
}))

// Mock window.location for URL resolution
const mockLocation = {
    pathname: '/',
    search: '',
    href: 'http://localhost:3000/'
}

Object.defineProperty(window, 'location', {
    value: mockLocation,
    writable: true
})

describe('AppConfig', () => {
    beforeEach(() => {
        // Reset window.location before each test
        window.location = mockLocation
    })

    test('renders with all required providers', () => {
        const {getByTestId} = render(<AppConfig />)
        
        expect(getByTestId('multi-site-provider')).toBeDefined()
        expect(getByTestId('commerce-api-provider')).toBeDefined()
        expect(getByTestId('customer-provider')).toBeDefined()
        expect(getByTestId('basket-provider')).toBeDefined()
        expect(getByTestId('customer-product-lists-provider')).toBeDefined()
        expect(getByTestId('chakra-provider')).toBeDefined()
    })

    test('renders with custom locals', () => {
        const mockLocals = {
            site: {id: 'test-site'},
            locale: {id: 'en-US'},
            api: {},
            buildUrl: () => 'test-url'
        }
        
        const {getByTestId} = render(<AppConfig locals={mockLocals} />)
        expect(getByTestId('multi-site-provider')).toBeDefined()
    })
})
