/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import {StorefrontPreview} from './index'
import {detectStorefrontPreview} from './utils'
import {Helmet} from 'react-helmet'

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
        window = {...oldWindow}
    })

    afterEach(() => {
        window = oldWindow
    })
    test('not renders nothing when enabled is off', async () => {
        render(<StorefrontPreview enabled={false} />)
        const helmet = Helmet.peek()
        await waitFor(() => {
            expect(helmet).toEqual(undefined)
        })
    })
    test('renders script tag when enabled is on', async () => {
        detectStorefrontPreview.mockReturnValue(true)

        render(<StorefrontPreview enabled={true} />)
        // this will return all the markup assigned to helmet
        // which will get rendered inside head.
        const helmet = Helmet.peek()
        await waitFor(() => {
            expect(helmet.scriptTags[0].src).toEqual(
                'https://runtime.commercecloud.com/cc/b2c/preview/preview.client.js'
            )
            expect(helmet.scriptTags[0].async).toEqual(true)
            expect(helmet.scriptTags[0].type).toEqual('text/javascript')
        })
    })

    test('renders script tag when window.STOREFRONT_PREVIEW.enabled is on', async () => {
        delete window.STOREFRONT_PREVIEW
        window.STOREFRONT_PREVIEW = {}
        window.STOREFRONT_PREVIEW.enabled = true
        detectStorefrontPreview.mockReturnValue(true)

        render(<StorefrontPreview />)
        // this will return all the markup assigned to helmet
        // which will get rendered inside head.
        const helmet = Helmet.peek()
        await waitFor(() => {
            expect(helmet.scriptTags[0].src).toEqual(
                'https://runtime.commercecloud.com/cc/b2c/preview/preview.client.js'
            )
            expect(helmet.scriptTags[0].async).toEqual(true)
            expect(helmet.scriptTags[0].type).toEqual('text/javascript')
        })
    })

    test('getToken is defined in window.STOREFRONT_PREVIEW when it is defined', async () => {
        window.STOREFRONT_PREVIEW = {}
        window.STOREFRONT_PREVIEW.enabled = true
        detectStorefrontPreview.mockReturnValue(true)

        render(<StorefrontPreview getToken={() => 'my-token'} />)
        expect(window.STOREFRONT_PREVIEW.getToken).toBeDefined()
    })
})

describe('Test', function () {})
