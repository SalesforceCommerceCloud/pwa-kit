/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import Link from '../../components/link/index'
import mockConfig from '../../mock-config'
const originalLocation = window.location

import {useConfig} from '../../hooks/use-config'
jest.mock('../../hooks/use-config', () => {
    return {
        useConfig: jest.fn()
    }
})

afterEach(() => {
    // Restore `window.location` to the `jsdom` `Location` object
    window.location = originalLocation

    jest.resetModules()
})

test('renders a link with locale prepended', () => {
    useConfig.mockImplementation(() => mockConfig)
    delete window.location
    window.location = new URL('/us/en-US', 'https://www.example.com')
    const {getByText} = renderWithProviders(<Link href="/mypage">My Page</Link>, {
        wrapperProps: {locale: {id: 'en-US'}, siteAlias: 'us', appConfig: mockConfig.app}
    })
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/us/en-US/mypage')
})

// TODO: This test needs to be fixed. I behaves differently than the others where mocking the useConfig was enough, this
// uses the multi-site context that would have to be mocked.

test.skip('renders a link with locale and site as query param', () => {
    useConfig.mockImplementation(() => ({
        ...mockConfig,
        locale: {id: 'en-US'},
        siteAlias: 'us',
        url: {
            site: 'query_param',
            locale: 'query_param',
            showDefaults: true
        }
    }))
    delete window.location
    window.location = new URL('https://www.example.com/women/dresses?site=us&locale=en-US')
    const {getByText} = renderWithProviders(<Link href="/mypage">My Page</Link>, {
        wrapperProps: {}
    })

    expect(getByText(/My Page/i)).toHaveAttribute('href', `/mypage?site=us&locale=en-US`)
})

test('accepts `to` prop as well', () => {
    useConfig.mockImplementation(() => mockConfig)
    delete window.location
    window.location = new URL('us/en-US', 'https://www.example.com')
    const {getByText} = renderWithProviders(<Link to="/mypage">My Page</Link>, {
        wrapperProps: {locale: {id: 'en-US'}, siteAlias: 'us', appConfig: mockConfig.app}
    })
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/us/en-US/mypage')
})

test('does not modify root url', () => {
    useConfig.mockImplementation(() => {
        return mockConfig
    })
    const {getByText} = renderWithProviders(<Link href="/">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/')
})
