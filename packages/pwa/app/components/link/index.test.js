/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import Link from './index'
import {DEFAULT_LOCALE} from '../../constants'

import {getUrlConfig} from '../../utils/utils'
jest.mock('../../utils/utils', () => {
    const original = jest.requireActual('../../utils/utils')
    return {
        ...original,
        getUrlConfig: jest.fn()
    }
})
test('renders a link with locale prepended', () => {
    getUrlConfig.mockImplementation(() => ({
        locale: 'path'
    }))
    const {getByText} = renderWithProviders(<Link href="/mypage">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', `/${DEFAULT_LOCALE}/mypage`)
})

test('renders a link with locale as query param', () => {
    getUrlConfig.mockImplementation(() => ({
        locale: 'query_param'
    }))
    const {getByText} = renderWithProviders(<Link href="/mypage">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', `/mypage?locale=${DEFAULT_LOCALE}`)
})

test('accepts `to` prop as well', () => {
    getUrlConfig.mockImplementation(() => ({
        locale: 'path'
    }))
    const {getByText} = renderWithProviders(<Link to="/mypage">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', `/${DEFAULT_LOCALE}/mypage`)
})

test('does not modify root url', () => {
    const {getByText} = renderWithProviders(<Link href="/">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/')
})
