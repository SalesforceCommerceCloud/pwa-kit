/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import Link from './index'

import {getConfig} from '../../utils/utils'
jest.mock('../../hooks/use-site')
jest.mock('../../utils/utils', () => {
    const original = jest.requireActual('../../utils/utils')
    return {
        ...original,
        getConfig: jest.fn()
    }
})
test('renders a link with locale prepended', () => {
    getConfig.mockImplementation(() => ({
        locale: 'path',
        site: 'path'
    }))
    const {getByText} = renderWithProviders(<Link href="/mypage">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/site-alias-2/en-GB/mypage')
})

test('renders a link with locale as query param', () => {
    getConfig.mockImplementation(() => ({
        locale: 'query_param'
    }))
    const {getByText} = renderWithProviders(<Link href="/mypage">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/mypage?locale=en-GB')
})

test('accepts `to` prop as well', () => {
    getConfig.mockImplementation(() => ({
        locale: 'path'
    }))
    const {getByText} = renderWithProviders(<Link to="/mypage">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/en-GB/mypage')
})

test('does not modify root url', () => {
    const {getByText} = renderWithProviders(<Link href="/">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/')
})
