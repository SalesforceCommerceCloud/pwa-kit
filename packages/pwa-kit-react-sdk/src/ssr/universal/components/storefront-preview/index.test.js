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

jest.mock('./utils', () => {
    const origin = jest.requireActual('./utils')
    return {
        ...origin,
        detectStorefrontPreview: jest.fn()
    }
})
describe('Storefront Preview Component', function () {
    const OLD_ENV = process.env
    beforeEach(() => {
        process.env = {...OLD_ENV}
    })
    afterEach(() => {
        process.env = OLD_ENV
    })
    test.only('renders script tag when enabled is on', () => {
        process.env.STOREFRONT_PREVIEW = 'true'
        detectStorefrontPreview.mockReturnValue(true)

        render(<StorefrontPreview />)
    })

    test('renders nothing when enabled is off', () => {})
})
