/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {mount} from 'enzyme'
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
        // eslint-disable-next-line
        window = {...oldWindow}
    })

    afterEach(() => {
        // eslint-disable-next-line
        window = oldWindow
    })
    test('not renders nothing when enabled is off', async () => {
        mount(<StorefrontPreview enabled={false} />)
        // this will return all the markup assigned to helmet
        // which will get rendered inside head.
        const helmet = Helmet.peek()
        expect(helmet).toBeUndefined()
    })
    test('renders script tag when enabled is on but host is not trusted', async () => {
        detectStorefrontPreview.mockReturnValue(false)

        mount(<StorefrontPreview />)
        // this will return all the markup assigned to helmet
        // which will get rendered inside head.
        const helmet = Helmet.peek()
        expect(helmet).toBeUndefined()
    })

    test('renders script tag when enabled is on', async () => {
        detectStorefrontPreview.mockReturnValue(true)

        mount(<StorefrontPreview enabled={true} />)
        // this will return all the markup assigned to helmet
        // which will get rendered inside head.
        const helmet = Helmet.peek()
        expect(helmet.scriptTags[0].src).toBe(
            'https://runtime.commercecloud.com/cc/b2c/preview/preview.client.js'
        )
        expect(helmet.scriptTags[0].async).toBe(true)
        expect(helmet.scriptTags[0].type).toBe('text/javascript')
    })

    test('getToken is defined in window.STOREFRONT_PREVIEW when it is defined', async () => {
        detectStorefrontPreview.mockReturnValue(true)

        mount(<StorefrontPreview getToken={() => 'my-token'} />)
        expect(window.STOREFRONT_PREVIEW.getToken).toBeDefined()
        expect(window.STOREFRONT_PREVIEW.navigate).toBeDefined()
    })
})
