/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable react/prop-types */
import React from 'react'
import {render} from '@testing-library/react'
import Seo from './index'

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn(() => ({
        defaultSiteTitle: 'Test Site'
    }))
}))

jest.mock('react-helmet', () => {
    const MockHelmet = ({children, ...props}) => (
        <div data-testid="helmet" {...props}>
            {children}
        </div>
    )
    MockHelmet.displayName = 'Helmet'
    return MockHelmet
})

describe('Seo', () => {
    test('renders with default site title only', () => {
        const {getByTestId} = render(<Seo />)
        const helmet = getByTestId('helmet')

        expect(helmet).toBeInTheDocument()
        expect(helmet).toHaveTextContent('Test Site')
    })

    test('renders with custom title combined with default site title', () => {
        const {getByTestId} = render(<Seo title="Custom Page" />)
        const helmet = getByTestId('helmet')

        expect(helmet).toHaveTextContent('Custom Page | Test Site')
    })

    test('renders with description meta tag', () => {
        const {container} = render(<Seo description="Test description" />)
        const metaDescription = container.querySelector('meta[name="description"]')

        expect(metaDescription).toBeInTheDocument()
        expect(metaDescription).toHaveAttribute('content', 'Test description')
    })

    test('renders with noIndex meta tag when noIndex is true', () => {
        const {container} = render(<Seo noIndex={true} />)
        const metaRobots = container.querySelector('meta[name="robots"]')

        expect(metaRobots).toBeInTheDocument()
        expect(metaRobots).toHaveAttribute('content', 'noindex')
    })

    test('does not render noIndex meta tag when noIndex is false', () => {
        const {container} = render(<Seo noIndex={false} />)
        const metaRobots = container.querySelector('meta[name="robots"]')

        expect(metaRobots).not.toBeInTheDocument()
    })

    test('renders with keywords meta tag', () => {
        const {container} = render(<Seo keywords="test, keywords, seo" />)
        const metaKeywords = container.querySelector('meta[name="keywords"]')

        expect(metaKeywords).toBeInTheDocument()
        expect(metaKeywords).toHaveAttribute('content', 'test, keywords, seo')
    })

    test('renders with children', () => {
        const {getByTestId} = render(
            <Seo>
                <meta name="custom" content="test" />
            </Seo>
        )
        const helmet = getByTestId('helmet')
        const customMeta = helmet.querySelector('meta[name="custom"]')

        expect(customMeta).toBeInTheDocument()
        expect(customMeta).toHaveAttribute('content', 'test')
    })

    test('renders with all props combined', () => {
        const {getByTestId, container} = render(
            <Seo
                title="Full Test"
                description="Full description"
                noIndex={true}
                keywords="full, test, keywords"
                data-testid="custom-helmet"
            >
                <meta name="author" content="Test Author" />
            </Seo>
        )

        const helmet = getByTestId('custom-helmet')

        // Check title
        expect(helmet).toHaveTextContent('Full Test | Test Site')

        // Check meta tags
        expect(container.querySelector('meta[name="description"]')).toHaveAttribute(
            'content',
            'Full description'
        )
        expect(container.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
        expect(container.querySelector('meta[name="keywords"]')).toHaveAttribute(
            'content',
            'full, test, keywords'
        )
        expect(helmet.querySelector('meta[name="author"]')).toHaveAttribute(
            'content',
            'Test Author'
        )

        // Check that additional props are passed through
        expect(helmet).toHaveAttribute('data-testid', 'custom-helmet')
    })

    test('does not render optional meta tags when props are not provided', () => {
        const {container} = render(<Seo title="Simple Test" />)

        expect(container.querySelector('meta[name="description"]')).not.toBeInTheDocument()
        expect(container.querySelector('meta[name="robots"]')).not.toBeInTheDocument()
        expect(container.querySelector('meta[name="keywords"]')).not.toBeInTheDocument()
    })
})
