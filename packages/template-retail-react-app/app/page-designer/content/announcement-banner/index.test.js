/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {
    AnnouncementBanner,
    AnnouncementBannerFallback
} from '@salesforce/retail-react-app/app/page-designer/content/announcement-banner/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

test('renders the message', () => {
    const {getByRole, getByText} = renderWithProviders(
        <AnnouncementBanner message="Free shipping this weekend" />
    )
    expect(getByRole('status')).toBeInTheDocument()
    expect(getByText('Free shipping this weekend')).toBeInTheDocument()
})

test('renders nothing when message is empty', () => {
    const {queryByRole} = renderWithProviders(<AnnouncementBanner message="" />)
    expect(queryByRole('status')).not.toBeInTheDocument()
})

test('renders a link only when both linkUrl and linkText are set', () => {
    const {getByRole} = renderWithProviders(
        <AnnouncementBanner message="Sale" linkUrl="/sale" linkText="Shop now" />
    )
    expect(getByRole('link', {name: 'Shop now'})).toBeInTheDocument()
})

test('does not render a link when only linkUrl is set', () => {
    const {queryByRole} = renderWithProviders(<AnnouncementBanner message="Sale" linkUrl="/sale" />)
    expect(queryByRole('link')).not.toBeInTheDocument()
})

test('applies destructive color scheme background', () => {
    const {getByRole} = renderWithProviders(
        <AnnouncementBanner message="Alert" colorScheme="destructive" />
    )
    // Chakra maps the `bg` prop to a background CSS declaration; assert the token resolved.
    expect(getByRole('status')).toHaveStyle({background: 'var(--chakra-colors-red-600)'})
})

test('falls back to md/center defaults for invalid enum values', () => {
    const {getByRole} = renderWithProviders(
        <AnnouncementBanner message="Hi" height="bogus" alignment="bogus" colorScheme="bogus" />
    )
    expect(getByRole('status')).toHaveStyle({justifyContent: 'center'})
})

test('fallback renders an aria-hidden skeleton', () => {
    const {container} = renderWithProviders(<AnnouncementBannerFallback />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
})
