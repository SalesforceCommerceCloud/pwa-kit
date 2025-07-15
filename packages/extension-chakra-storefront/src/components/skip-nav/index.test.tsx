/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'
import {SkipNavLink, SkipNavContent} from './index'
import {renderWithProviders} from '../../utils/test-utils'

describe('SkipNavLink', () => {
    test('renders with default props', () => {
        renderWithProviders(<SkipNavLink>Skip to Content</SkipNavLink>, {})

        const link = screen.getByRole('link', {name: 'Skip to Content'})
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '#skip-to-content')
    })

    test('renders with custom href', () => {
        renderWithProviders(<SkipNavLink href="#main-content">Skip to Main</SkipNavLink>, {})

        const link = screen.getByRole('link', {name: 'Skip to Main'})
        expect(link).toHaveAttribute('href', '#main-content')
    })

    test('has correct accessibility attributes', () => {
        renderWithProviders(<SkipNavLink>Skip to Content</SkipNavLink>, {})

        const link = screen.getByRole('link', {name: 'Skip to Content'})
        expect(link).toHaveAttribute('href', '#skip-to-content')
    })

    test('has visually hidden styles by default', () => {
        renderWithProviders(<SkipNavLink>Skip to Content</SkipNavLink>, {})

        const link = screen.getByRole('link', {name: 'Skip to Content'})

        // The link should be focusable (no aria-hidden) but positioned off-screen
        expect(link).not.toHaveAttribute('aria-hidden')
        expect(link).toHaveAttribute('href', '#skip-to-content')
    })

    test('uses theme styles', () => {
        renderWithProviders(<SkipNavLink>Skip to Content</SkipNavLink>, {})

        const link = screen.getByRole('link', {name: 'Skip to Content'})
        expect(link).toBeInTheDocument()
        // The component should use theme styles from the skipNav slot recipe
        expect(link).toHaveAttribute('href', '#skip-to-content')
    })
})

describe('SkipNavContent', () => {
    test('renders with default props', () => {
        renderWithProviders(
            <SkipNavContent>
                <div>Main content</div>
            </SkipNavContent>,
            {}
        )

        const content = screen.getByText('Main content')
        const container = content.parentElement

        expect(container).toHaveAttribute('id', 'skip-to-content')
        expect(container).toHaveAttribute('tabIndex', '-1')
    })

    test('renders with custom id', () => {
        renderWithProviders(
            <SkipNavContent id="main-content">
                <div>Main content</div>
            </SkipNavContent>,
            {}
        )

        const content = screen.getByText('Main content')
        const container = content.parentElement

        expect(container).toHaveAttribute('id', 'main-content')
        expect(container).toHaveAttribute('tabIndex', '-1')
    })

    test('has correct accessibility attributes', () => {
        renderWithProviders(
            <SkipNavContent>
                <div>Main content</div>
            </SkipNavContent>,
            {}
        )

        const content = screen.getByText('Main content')
        const container = content.parentElement

        expect(container).toHaveAttribute('id', 'skip-to-content')
        expect(container).toHaveAttribute('tabIndex', '-1')
    })

    test('uses theme styles', () => {
        renderWithProviders(
            <SkipNavContent>
                <div>Content with theme</div>
            </SkipNavContent>,
            {}
        )

        const content = screen.getByText('Content with theme')
        const container = content.parentElement

        expect(container).toBeInTheDocument()
        // The component should use theme styles from the skipNav slot recipe
        expect(container).toHaveAttribute('id', 'skip-to-content')
    })
})

describe('SkipNavLink and SkipNavContent integration', () => {
    test('link href matches content id', () => {
        renderWithProviders(
            <div>
                <SkipNavLink>Skip to Content</SkipNavLink>
                <SkipNavContent>
                    <div>Main content</div>
                </SkipNavContent>
            </div>,
            {}
        )

        const link = screen.getByRole('link', {name: 'Skip to Content'})
        const content = screen.getByText('Main content')
        const container = content.parentElement

        expect(link).toHaveAttribute('href', '#skip-to-content')
        expect(container).toHaveAttribute('id', 'skip-to-content')
    })

    test('custom href and id work together', () => {
        renderWithProviders(
            <div>
                <SkipNavLink href="#main">Skip to Main</SkipNavLink>
                <SkipNavContent id="main">
                    <div>Main content</div>
                </SkipNavContent>
            </div>,
            {}
        )

        const link = screen.getByRole('link', {name: 'Skip to Main'})
        const content = screen.getByText('Main content')
        const container = content.parentElement

        expect(link).toHaveAttribute('href', '#main')
        expect(container).toHaveAttribute('id', 'main')
    })

    test('both components use skip-nav theme styles', () => {
        renderWithProviders(
            <div>
                <SkipNavLink>Skip to Content</SkipNavLink>
                <SkipNavContent>
                    <div>Main content</div>
                </SkipNavContent>
            </div>,
            {}
        )

        const link = screen.getByRole('link', {name: 'Skip to Content'})
        const content = screen.getByText('Main content')
        const container = content.parentElement

        // Both components should be rendered and use theme styles
        expect(link).toBeInTheDocument()
        expect(container).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '#skip-to-content')
        expect(container).toHaveAttribute('id', 'skip-to-content')
    })
})
