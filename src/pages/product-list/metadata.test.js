/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render} from '@testing-library/react'
import Metadata from './metadata'

jest.mock('../../components/seo', () => {
    return function MockSeo(props) {
        return <div data-testid="seo" {...props} />
    }
})

describe('Metadata', () => {
    describe('when category is provided', () => {
        it('renders Seo with category data', () => {
            const category = {
                pageTitle: 'Category Title',
                pageDescription: 'Category Description',
                pageKeywords: 'category, keywords'
            }

            const {getByTestId} = render(<Metadata category={category} />)

            const seoElement = getByTestId('seo')
            expect(seoElement).toHaveAttribute('title', 'Category Title')
            expect(seoElement).toHaveAttribute('description', 'Category Description')
            expect(seoElement).toHaveAttribute('keywords', 'category, keywords')
        })

        it('renders Seo with partial category data', () => {
            const category = {
                pageTitle: 'Category Title'
                // Missing pageDescription and pageKeywords
            }

            const {getByTestId} = render(<Metadata category={category} />)

            const seoElement = getByTestId('seo')
            expect(seoElement).toHaveAttribute('title', 'Category Title')
            expect(seoElement).toHaveAttribute('description', '')
            expect(seoElement).toHaveAttribute('keywords', '')
        })
    })

    describe('when searchQuery is provided', () => {
        it('renders Seo with search query data', () => {
            const searchQuery = 'search term'

            const {getByTestId} = render(<Metadata searchQuery={searchQuery} />)

            const seoElement = getByTestId('seo')
            expect(seoElement).toHaveAttribute('title', 'search term')
            expect(seoElement).toHaveAttribute('description', 'search term')
            expect(seoElement).toHaveAttribute('keywords', '')
        })

        it('renders Seo with search query and product search result meta tags', () => {
            const searchQuery = 'search term'
            const productSearchResult = {
                pageMetaTags: [
                    {id: 'keywords', value: 'search, keywords'},
                    {id: 'author', value: 'Salesforce'}
                ]
            }

            const {getByTestId} = render(
                <Metadata searchQuery={searchQuery} productSearchResult={productSearchResult} />
            )

            const seoElement = getByTestId('seo')
            expect(seoElement).toHaveAttribute('title', 'search term')
            expect(seoElement).toHaveAttribute('description', 'search term')
            expect(seoElement).toHaveAttribute('keywords', 'search, keywords')
        })

        it('renders Seo with search query when productSearchResult has no meta tags', () => {
            const searchQuery = 'search term'
            const productSearchResult = {
                pageMetaTags: []
            }

            const {getByTestId} = render(
                <Metadata searchQuery={searchQuery} productSearchResult={productSearchResult} />
            )

            const seoElement = getByTestId('seo')
            expect(seoElement).toHaveAttribute('title', 'search term')
            expect(seoElement).toHaveAttribute('description', 'search term')
            expect(seoElement).toHaveAttribute('keywords', '')
        })

        it('renders Seo with search query when productSearchResult is undefined', () => {
            const searchQuery = 'search term'

            const {getByTestId} = render(<Metadata searchQuery={searchQuery} />)

            const seoElement = getByTestId('seo')
            expect(seoElement).toHaveAttribute('title', 'search term')
            expect(seoElement).toHaveAttribute('description', 'search term')
            expect(seoElement).toHaveAttribute('keywords', '')
        })
    })

    describe('when both category and searchQuery are provided', () => {
        it('prioritizes category over searchQuery', () => {
            const category = {
                pageTitle: 'Category Title',
                pageDescription: 'Category Description',
                pageKeywords: 'category, keywords'
            }
            const searchQuery = 'search term'

            const {getByTestId} = render(<Metadata category={category} searchQuery={searchQuery} />)

            const seoElement = getByTestId('seo')
            expect(seoElement).toHaveAttribute('title', 'Category Title')
            expect(seoElement).toHaveAttribute('description', 'Category Description')
            expect(seoElement).toHaveAttribute('keywords', 'category, keywords')
        })
    })

    describe('when no relevant props are provided', () => {
        it('returns null', () => {
            const {container} = render(<Metadata />)
            expect(container.firstChild).toBeNull()
        })

        it('returns null when props are empty', () => {
            const {container} = render(
                <Metadata category={null} searchQuery="" productSearchResult={null} />
            )
            expect(container.firstChild).toBeNull()
        })
    })
})
