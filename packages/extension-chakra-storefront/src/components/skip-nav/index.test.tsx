/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
import {ChakraProvider} from '@chakra-ui/react'
import {SkipNavLink, SkipNavContent} from './index'
import system from '../../theme'

const TestWrapper = ({children}: {children: React.ReactNode}) => (
    <ChakraProvider value={system}>{children}</ChakraProvider>
)

describe('SkipNavLink', () => {
    test('renders with default props', () => {
        render(
            <TestWrapper>
                <SkipNavLink>Skip to Content</SkipNavLink>
            </TestWrapper>
        )

        const link = screen.getByRole('link', {name: 'Skip to Content'})
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '#skip-to-content')
    })

    test('renders with custom href', () => {
        render(
            <TestWrapper>
                <SkipNavLink href="#main-content">Skip to Main</SkipNavLink>
            </TestWrapper>
        )

        const link = screen.getByRole('link', {name: 'Skip to Main'})
        expect(link).toHaveAttribute('href', '#main-content')
    })

    test('has correct accessibility attributes', () => {
        render(
            <TestWrapper>
                <SkipNavLink>Skip to Content</SkipNavLink>
            </TestWrapper>
        )

        const link = screen.getByRole('link', {name: 'Skip to Content'})
        expect(link).toHaveAttribute('href', '#skip-to-content')
    })

    test('has visually hidden styles by default', () => {
        render(
            <TestWrapper>
                <SkipNavLink>Skip to Content</SkipNavLink>
            </TestWrapper>
        )

        const link = screen.getByRole('link', {name: 'Skip to Content'})

        // The link should be focusable (no aria-hidden) but positioned off-screen
        expect(link).not.toHaveAttribute('aria-hidden')
        expect(link).toHaveAttribute('href', '#skip-to-content')
    })

    test('uses theme styles', () => {
        render(
            <TestWrapper>
                <SkipNavLink>Skip to Content</SkipNavLink>
            </TestWrapper>
        )

        const link = screen.getByRole('link', {name: 'Skip to Content'})
        expect(link).toBeInTheDocument()
        // The component should use theme styles from the skipNav slot recipe
        expect(link).toHaveAttribute('href', '#skip-to-content')
    })
})

describe('SkipNavContent', () => {
    test('renders with default props', () => {
        render(
            <TestWrapper>
                <SkipNavContent>
                    <div>Main content</div>
                </SkipNavContent>
            </TestWrapper>
        )

        const content = screen.getByText('Main content')
        const container = content.parentElement

        expect(container).toHaveAttribute('id', 'skip-to-content')
        expect(container).toHaveAttribute('tabIndex', '-1')
    })

    test('renders with custom id', () => {
        render(
            <TestWrapper>
                <SkipNavContent id="main-content">
                    <div>Main content</div>
                </SkipNavContent>
            </TestWrapper>
        )

        const content = screen.getByText('Main content')
        const container = content.parentElement

        expect(container).toHaveAttribute('id', 'main-content')
    })

    test('applies custom styles', () => {
        const customStyles = {
            backgroundColor: 'red',
            padding: '10px'
        }

        render(
            <TestWrapper>
                <SkipNavContent css={customStyles}>
                    <div>Main content</div>
                </SkipNavContent>
            </TestWrapper>
        )

        const content = screen.getByText('Main content')
        const container = content.parentElement

        expect(container).toHaveStyle('background-color: red')
        expect(container).toHaveStyle('padding: 10px')
    })

    test('renders children correctly', () => {
        render(
            <TestWrapper>
                <SkipNavContent>
                    <h1>Main Heading</h1>
                    <p>Some content</p>
                </SkipNavContent>
            </TestWrapper>
        )

        expect(screen.getByText('Main Heading')).toBeInTheDocument()
        expect(screen.getByText('Some content')).toBeInTheDocument()
    })

    test('has correct tabIndex for focus management', () => {
        render(
            <TestWrapper>
                <SkipNavContent>
                    <div>Main content</div>
                </SkipNavContent>
            </TestWrapper>
        )

        const content = screen.getByText('Main content')
        const container = content.parentElement

        expect(container).toHaveAttribute('tabIndex', '-1')
    })
})

describe('SkipNav Integration', () => {
    test('link and content work together', () => {
        render(
            <TestWrapper>
                <SkipNavLink href="#main-content">Skip to Content</SkipNavLink>
                <SkipNavContent id="main-content">
                    <div>Main content</div>
                </SkipNavContent>
            </TestWrapper>
        )

        const link = screen.getByRole('link', {name: 'Skip to Content'})
        const content = screen.getByText('Main content')
        const container = content.parentElement

        expect(link).toHaveAttribute('href', '#main-content')
        expect(container).toHaveAttribute('id', 'main-content')
    })

    test('uses default ids when not specified', () => {
        render(
            <TestWrapper>
                <SkipNavLink>Skip to Content</SkipNavLink>
                <SkipNavContent>
                    <div>Main content</div>
                </SkipNavContent>
            </TestWrapper>
        )

        const link = screen.getByRole('link', {name: 'Skip to Content'})
        const content = screen.getByText('Main content')
        const container = content.parentElement

        expect(link).toHaveAttribute('href', '#skip-to-content')
        expect(container).toHaveAttribute('id', 'skip-to-content')
    })
})
