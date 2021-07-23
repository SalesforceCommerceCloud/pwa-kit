import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import Link from './index'

test('renders a link with locale prepended', () => {
    const {getByText} = renderWithProviders(<Link href="/mypage">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/en/mypage')
})

test('accepts `to` prop as well', () => {
    const {getByText} = renderWithProviders(<Link to="/mypage">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/en/mypage')
})

test('does not modify root url', () => {
    const {getByText} = renderWithProviders(<Link href="/">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/')
})

test('does not modify href if correct locale is included in passed prop', () => {
    const {getByText} = renderWithProviders(<Link href="/en/mypage">My Page</Link>)
    expect(getByText(/My Page/i)).toHaveAttribute('href', '/en/mypage')
})
