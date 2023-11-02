// @ts-nocheck 
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, waitFor} from '@testing-library/react'
import StorefrontPreview from './storefront-preview'
import {detectStorefrontPreview} from './utils'
import {Helmet} from 'react-helmet'

declare global {
    interface Window {
        STOREFRONT_PREVIEW: any
    }
}

jest.mock('./utils', () => {
    const origin = jest.requireActual('./utils')
    return {
        ...origin,
        detectStorefrontPreview: jest.fn()
    }
})

describe('Storefront Preview Component', function () {
    const oldWindow = window

    beforeEach(() => {
        // eslint-disable-next-line
        window = {...oldWindow}
    })

    afterEach(() => {
        // eslint-disable-next-line
        window = oldWindow
    })

    test('Renders children when enabled', async () => {
        const MockComponent = () => <div data-testid="mockComponent">Mock Component</div>
        const wrapper = render(
            <StorefrontPreview enabled={true} getToken={() => 'my-token'}>
                <MockComponent />
            </StorefrontPreview>
        )
        expect(wrapper.getByTestId('mockComponent')).toBeDefined()
    })

    test('Renders children when disabled', async () => {
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
        // @ts-ignore
        detectStorefrontPreview.mockReturnValue(false)

        render(<StorefrontPreview />)
        // this will return all the markup assigned to helmet
        // which will get rendered inside head.
        const helmet = Helmet.peek()
        await waitFor(() => {
            expect(helmet).toBeUndefined()
        })
    })
    test('renders script tag when enabled is on', async () => {
        // @ts-ignore
        detectStorefrontPreview.mockReturnValue(true)

        render(<StorefrontPreview enabled={true} />)
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

    test('getToken is defined in window.STOREFRONT_PREVIEW when it is defined', async () => {
        window.STOREFRONT_PREVIEW = {}
        // @ts-ignore
        detectStorefrontPreview.mockReturnValue(true)

        render(<StorefrontPreview getToken={() => 'my-token'} />)
        expect(window.STOREFRONT_PREVIEW.getToken).toBeDefined()
        expect(window.STOREFRONT_PREVIEW.navigate).toBeDefined()
    })
})
