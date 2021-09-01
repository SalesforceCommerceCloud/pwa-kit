/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import Link from './index'

test('renders a link with locale prepended', () => {
    const {getByText} = renderWithProviders(<Link href="/mypage">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/en-GB/mypage')
})

test('accepts `to` prop as well', () => {
    const {getByText} = renderWithProviders(<Link to="/mypage">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/en-GB/mypage')
})

test('does not modify root url', () => {
    const {getByText} = renderWithProviders(<Link href="/">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/')
})

test('does not modify href if correct locale is included in passed prop', () => {
    const {getByText} = renderWithProviders(<Link href="/en-GB/mypage">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/en-GB/mypage')
})
