/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import Link from './index'
import mockConfig from '../../../config/mocks/default.json'
import {setConfig} from 'pwa-kit-react-sdk/ssr/universal/utils'
const originalLocation = window.location
const originalConfig = window.__CONFIG__

afterEach(() => {
    // Restore `window.location` to the `jsdom` `Location` object
    window.location = originalLocation

    jest.resetModules()
    // Restore window.__CONFIG
    setConfig(originalConfig)
})

test('renders a link with locale prepended', () => {
    delete window.location
    window.location = new URL('us/en-US', 'https://www.example.com')
    const {getByText} = renderWithProviders(<Link href="/mypage">My Page</Link>, {
        wrapperProps: {locale: 'en-US'}
    })
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/us/en-US/mypage')
})

test('renders a link with locale and site as query param', () => {
    // delete window.__CONFIG__
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
    setConfig(newConfig)
    delete window.location
    window.location = new URL('https://www.example.com/women/dresses?site=us&locale=en-US')
    const {getByText} = renderWithProviders(<Link href="/mypage">My Page</Link>, {
        wrapperProps: {locale: 'en-US'}
    })

    expect(getByText(/My Page/i)).toHaveAttribute('href', `/mypage?site=us&locale=en-US`)
})

test('accepts `to` prop as well', () => {
    delete window.location
    window.location = new URL('us/en-US', 'https://www.example.com')
    const {getByText} = renderWithProviders(<Link to="/mypage">My Page</Link>, {
        wrapperProps: {locale: 'en-US'}
    })
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/us/en-US/mypage')
})

test('does not modify root url', () => {
    const {getByText} = renderWithProviders(<Link href="/">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/')
})
