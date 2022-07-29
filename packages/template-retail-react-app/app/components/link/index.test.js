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
    window.location = new URL('/us/en-US', 'https://www.example.com')
    const {getByText} = renderWithProviders(<Link href="/mypage">My Page</Link>, {
        wrapperProps: {locale: 'en-US', siteAlias: 'us', appConfig: mockConfig.app}
    })
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/us/en-US/mypage')
})

test('renders a link with locale and site as query param', () => {
    const newConfig = {
        ...mockConfig,
        app: {
            ...mockConfig.app,
            url: {
                site: 'query_param',
                locale: 'query_param',
                showDefaults: true
            }
        }
    }
    getConfig.mockImplementation(() => newConfig)
    delete window.location
    window.location = new URL('https://www.example.com/women/dresses?site=us&locale=en-US')
    const {getByText} = renderWithProviders(<Link href="/mypage">My Page</Link>, {
        wrapperProps: {locale: 'en-US', siteAlias: 'us', appConfig: newConfig.app}
    })

    expect(getByText(/My Page/i)).toHaveAttribute('href', `/mypage?site=us&locale=en-US`)
})

test('accepts `to` prop as well', () => {
    getConfig.mockImplementation(() => mockConfig)
    delete window.location
    window.location = new URL('us/en-US', 'https://www.example.com')
    const {getByText} = renderWithProviders(<Link to="/mypage">My Page</Link>, {
        wrapperProps: {locale: 'en-US', siteAlias: 'us', appConfig: mockConfig.app}
    })
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/us/en-US/mypage')
})

test('does not modify root url', () => {
    getConfig.mockImplementation(() => mockConfig)
    const {getByText} = renderWithProviders(<Link href="/">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/')
})
