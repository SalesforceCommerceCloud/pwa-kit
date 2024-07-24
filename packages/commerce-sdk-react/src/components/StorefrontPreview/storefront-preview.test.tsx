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
        STOREFRONT_PREVIEW?: Record<string, unknown>
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

describe('Storefront Preview Component', function () {
    beforeEach(() => {
        delete window.STOREFRONT_PREVIEW
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

    test('cache breaker is added to the parameters of SCAPI requests, only if in storefront preview', () => {
        ;(detectStorefrontPreview as jest.Mock).mockReturnValue(true)
        mockQueryEndpoint('baskets/123', {})

        jest.spyOn(Date, 'now').mockImplementation(() => 1000)

        let getBasketSpy
        const parameters = {basketId: '123'}
        const MockedComponent = ({enableStorefrontPreview}: {enableStorefrontPreview: boolean}) => {
            const apiClients = useCommerceApi()
            getBasketSpy = jest.spyOn(apiClients.shopperBaskets, 'getBasket')
            useEffect(() => {
                void apiClients.shopperBaskets.getBasket({parameters})
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
