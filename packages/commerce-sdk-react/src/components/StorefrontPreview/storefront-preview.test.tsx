/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {render, waitFor} from '@testing-library/react'
import StorefrontPreview from './storefront-preview'
import {detectStorefrontPreview} from './utils'
import {Helmet} from 'react-helmet'
import {mockQueryEndpoint, renderWithProviders} from '../../test-utils'
import {useCommerceApi, useConfig} from '../../hooks'

declare global {
    interface Window {
        STOREFRONT_PREVIEW?: {
            getToken?: () => string | undefined | Promise<string | undefined>
            onContextChange?: () => void | Promise<void>
            siteId?: string
            experimentalUnsafeNavigate?: (
                path: string | {pathname: string; search?: string; hash?: string; state?: unknown},
                action?: 'push' | 'replace',
                ...args: unknown[]
            ) => void
        }
    }
}

jest.mock('./utils', () => {
    const origin = jest.requireActual('./utils')
    return {
        ...origin,
        detectStorefrontPreview: jest.fn()
    }
})
jest.mock('../../auth/index.ts')
jest.mock('../../hooks/useConfig', () => jest.fn())

const mockPush = jest.fn()
const mockReplace = jest.fn()
jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('react-router-dom')
    return {
        ...actual,
        useHistory: () => ({
            push: mockPush,
            replace: mockReplace
        })
    }
})

describe('Storefront Preview Component', function () {
    beforeEach(() => {
        delete window.STOREFRONT_PREVIEW
        mockPush.mockClear()
        mockReplace.mockClear()
        ;(useConfig as jest.Mock).mockReturnValue({siteId: 'site-id'})
    })
    afterEach(() => {
        jest.restoreAllMocks()
    })

    test('Renders children when enabled', () => {
        const MockComponent = () => <div data-testid="mockComponent">Mock Component</div>
        const wrapper = render(
            <StorefrontPreview enabled={true} getToken={() => 'my-token'}>
                <MockComponent />
            </StorefrontPreview>
        )
        expect(wrapper.getByTestId('mockComponent')).toBeDefined()
    })

    test('Renders children when disabled', () => {
        const MockComponent = () => <div data-testid="mockComponent">Mock Component</div>
        const wrapper = render(
            <StorefrontPreview enabled={false}>
                <MockComponent />
            </StorefrontPreview>
        )
        expect(wrapper.getByTestId('mockComponent')).toBeDefined()
    })

    test('not renders nothing when enabled is off', async () => {
        render(<StorefrontPreview enabled={false} />)
        const helmet = Helmet.peek()
        await waitFor(() => {
            expect(helmet).toBeUndefined()
        })
    })
    test('renders script tag when enabled is on but host is not trusted', async () => {
        ;(detectStorefrontPreview as jest.Mock).mockReturnValue(false)

        render(<StorefrontPreview getToken={() => undefined} />)
        // this will return all the markup assigned to helmet
        // which will get rendered inside head.
        const helmet = Helmet.peek()
        await waitFor(() => {
            expect(helmet).toBeUndefined()
        })
    })
    test('renders script tag when enabled is on', async () => {
        ;(detectStorefrontPreview as jest.Mock).mockReturnValue(true)

        render(<StorefrontPreview enabled={true} getToken={() => undefined} />)
        // this will return all the markup assigned to helmet
        // which will get rendered inside head.
        const helmet = Helmet.peek()
        await waitFor(() => {
            expect(helmet.scriptTags[0].src).toBe(
                'https://runtime.commercecloud.com/cc/b2c/preview/preview.client.js'
            )
            expect(helmet.scriptTags[0].async).toBe(true)
            expect(helmet.scriptTags[0].type).toBe('text/javascript')
        })
    })

    test('window.STOREFRONT_PREVIEW is defined properly', () => {
        ;(detectStorefrontPreview as jest.Mock).mockReturnValue(true)

        render(
            <StorefrontPreview
                enabled={true}
                getToken={() => 'my-token'}
                onContextChange={() => {}}
            />
        )
        expect(window.STOREFRONT_PREVIEW?.getToken).toBeDefined()
        expect(window.STOREFRONT_PREVIEW?.onContextChange).toBeDefined()
        expect(window.STOREFRONT_PREVIEW?.siteId).toBeDefined()
        expect(window.STOREFRONT_PREVIEW?.experimentalUnsafeNavigate).toBeDefined()
    })

    test('experimentalUnsafeNavigate removes base path from path when getBasePath is provided', () => {
        ;(detectStorefrontPreview as jest.Mock).mockReturnValue(true)

        render(
            <StorefrontPreview
                enabled={true}
                getToken={() => 'my-token'}
                getBasePath={() => '/mybase'}
            />
        )

        window.STOREFRONT_PREVIEW?.experimentalUnsafeNavigate?.('/mybase/product/123', 'push')
        expect(mockPush).toHaveBeenCalledWith('/product/123')

        mockPush.mockClear()
        window.STOREFRONT_PREVIEW?.experimentalUnsafeNavigate?.('/mybase/account', 'replace')
        expect(mockReplace).toHaveBeenCalledWith('/account')
    })

    test('experimentalUnsafeNavigate does not remove when path does not start with base path', () => {
        ;(detectStorefrontPreview as jest.Mock).mockReturnValue(true)

        render(
            <StorefrontPreview
                enabled={true}
                getToken={() => 'my-token'}
                getBasePath={() => '/mybase'}
            />
        )

        window.STOREFRONT_PREVIEW?.experimentalUnsafeNavigate?.('/other/product/123', 'push')
        expect(mockPush).toHaveBeenCalledWith('/other/product/123')
    })

    test('experimentalUnsafeNavigate does not strip when path has basePath only as substring (e.g. /shop vs /shopping/cart)', () => {
        ;(detectStorefrontPreview as jest.Mock).mockReturnValue(true)

        render(
            <StorefrontPreview
                enabled={true}
                getToken={() => 'my-token'}
                getBasePath={() => '/shop'}
            />
        )

        window.STOREFRONT_PREVIEW?.experimentalUnsafeNavigate?.('/shopping/cart', 'push')
        expect(mockPush).toHaveBeenCalledWith('/shopping/cart')
    })

    test('experimentalUnsafeNavigate strips to / when path exactly equals basePath', () => {
        ;(detectStorefrontPreview as jest.Mock).mockReturnValue(true)

        render(
            <StorefrontPreview
                enabled={true}
                getToken={() => 'my-token'}
                getBasePath={() => '/mybase'}
            />
        )

        window.STOREFRONT_PREVIEW?.experimentalUnsafeNavigate?.('/mybase', 'push')
        expect(mockPush).toHaveBeenCalledWith('/')
    })

    test('experimentalUnsafeNavigate removes base path from location object when getBasePath is provided', () => {
        ;(detectStorefrontPreview as jest.Mock).mockReturnValue(true)

        render(
            <StorefrontPreview
                enabled={true}
                getToken={() => 'my-token'}
                getBasePath={() => '/mybase'}
            />
        )

        window.STOREFRONT_PREVIEW?.experimentalUnsafeNavigate?.(
            {pathname: '/mybase/product/123', search: '?q=1'},
            'push'
        )
        expect(mockPush).toHaveBeenCalledWith({pathname: '/product/123', search: '?q=1'})
    })

    test('experimentalUnsafeNavigate strips base path prefix from /__pwa-kit/ paths when getBasePath returns empty (showBasePath false)', () => {
        ;(detectStorefrontPreview as jest.Mock).mockReturnValue(true)

        render(
            <StorefrontPreview
                enabled={true}
                getToken={() => 'my-token'}
                getBasePath={() => ''}
            />
        )

        // Runtime Admin sends /test/__pwa-kit/refresh but React Router has no basename
        window.STOREFRONT_PREVIEW?.experimentalUnsafeNavigate?.(
            '/test/__pwa-kit/refresh?referrer=/some-page',
            'replace'
        )
        expect(mockReplace).toHaveBeenCalledWith('/__pwa-kit/refresh?referrer=/some-page')
    })

    test('experimentalUnsafeNavigate strips base path prefix from /__pwa-kit/ location objects when getBasePath returns empty', () => {
        ;(detectStorefrontPreview as jest.Mock).mockReturnValue(true)

        render(
            <StorefrontPreview
                enabled={true}
                getToken={() => 'my-token'}
                getBasePath={() => ''}
            />
        )

        window.STOREFRONT_PREVIEW?.experimentalUnsafeNavigate?.(
            {pathname: '/test/__pwa-kit/refresh', search: '?referrer=/some-page'},
            'replace'
        )
        expect(mockReplace).toHaveBeenCalledWith({
            pathname: '/__pwa-kit/refresh',
            search: '?referrer=/some-page'
        })
    })

    test('experimentalUnsafeNavigate normalizes /__pwa-kit/ paths and then strips router base path (showBasePath true)', () => {
        ;(detectStorefrontPreview as jest.Mock).mockReturnValue(true)

        render(
            <StorefrontPreview
                enabled={true}
                getToken={() => 'my-token'}
                getBasePath={() => '/test'}
            />
        )

        // Runtime Admin sends /test/__pwa-kit/refresh, normalizePwaKitPath strips to
        // /__pwa-kit/refresh, then removeBasePathFromLocation is a no-op (doesn't start with /test/)
        // React Router re-adds the basename, so history receives /__pwa-kit/refresh
        window.STOREFRONT_PREVIEW?.experimentalUnsafeNavigate?.(
            '/test/__pwa-kit/refresh?referrer=/test/some-page',
            'replace'
        )
        expect(mockReplace).toHaveBeenCalledWith('/__pwa-kit/refresh?referrer=/test/some-page')
    })

    test('experimentalUnsafeNavigate does not alter /__pwa-kit/ paths that have no prefix', () => {
        ;(detectStorefrontPreview as jest.Mock).mockReturnValue(true)

        render(
            <StorefrontPreview
                enabled={true}
                getToken={() => 'my-token'}
                getBasePath={() => ''}
            />
        )

        // Path already starts with /__pwa-kit/ — no prefix to strip
        window.STOREFRONT_PREVIEW?.experimentalUnsafeNavigate?.(
            '/__pwa-kit/refresh?referrer=/some-page',
            'push'
        )
        expect(mockPush).toHaveBeenCalledWith('/__pwa-kit/refresh?referrer=/some-page')
    })

    test('experimentalUnsafeNavigate does not affect non /__pwa-kit/ paths when showBasePath is false', () => {
        ;(detectStorefrontPreview as jest.Mock).mockReturnValue(true)

        render(
            <StorefrontPreview
                enabled={true}
                getToken={() => 'my-token'}
                getBasePath={() => ''}
            />
        )

        // Regular navigation paths should pass through untouched
        window.STOREFRONT_PREVIEW?.experimentalUnsafeNavigate?.('/products/123', 'push')
        expect(mockPush).toHaveBeenCalledWith('/products/123')
    })

    test('cache breaker is added to the parameters of SCAPI requests, only if in storefront preview', () => {
        ;(detectStorefrontPreview as jest.Mock).mockReturnValue(true)
        mockQueryEndpoint('baskets/123', {})

        jest.spyOn(Date, 'now').mockImplementation(() => 1000)

        let getBasketSpy
        const parameters = {basketId: '123'}
        const MockedComponent = ({enableStorefrontPreview}: {enableStorefrontPreview: boolean}) => {
            const apiClients = useCommerceApi()
            getBasketSpy = jest.spyOn(apiClients.shopperBaskets!, 'getBasket')
            useEffect(() => {
                void apiClients.shopperBaskets!.getBasket({parameters})
            }, [])
            return (
                <StorefrontPreview enabled={enableStorefrontPreview} getToken={() => 'my-token'} />
            )
        }

        renderWithProviders(<MockedComponent enableStorefrontPreview={true} />)
        expect(getBasketSpy).toHaveBeenCalledWith({
            parameters: {...parameters, c_cache_breaker: 1000}
        })

        renderWithProviders(<MockedComponent enableStorefrontPreview={false} />)
        expect(getBasketSpy).toHaveBeenCalledWith({
            parameters
        })
    })
})
