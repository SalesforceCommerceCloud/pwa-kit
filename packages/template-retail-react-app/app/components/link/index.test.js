/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import Link from './index'
import mockConfig from '../../../config/mocks/default'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
const originalLocation = window.location
jest.mock('pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: jest.fn()
    }
})

afterEach(() => {
    // Restore `window.location` to the `jsdom` `Location` object
    window.location = originalLocation

    jest.resetModules()
})

test('renders a link with locale prepended', () => {
    getConfig.mockImplementation(() => mockConfig)
    delete window.location
    window.location = new URL('/uk/en-GB', 'https://www.example.com')
    const {getByText} = renderWithProviders(<Link href="/mypage">My Page</Link>, {
        wrapperProps: {locale: 'en-GB'}
    })
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/uk/en-GB/mypage')
})

test('accepts `to` prop as well', () => {
    getConfig.mockImplementation(() => mockConfig)
    delete window.location
    window.location = new URL('uk/en-GB', 'https://www.example.com')
    const {getByText} = renderWithProviders(<Link to="/mypage">My Page</Link>, {
        wrapperProps: {locale: 'en-GB'}
    })
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/uk/en-GB/mypage')
})

test('does not modify root url', () => {
    getConfig.mockImplementation(() => mockConfig)
    const {getByText} = renderWithProviders(<Link href="/">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/')
})
