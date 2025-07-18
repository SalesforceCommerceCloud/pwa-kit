/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render} from '@testing-library/react'
import Metadata from './page-metadata'

jest.mock('../../components/seo', () => {
    return function MockSeo(props) {
        return <div data-testid="seo" data-props={JSON.stringify(props)} />
    }
})

describe('Metadata', () => {
    test('returns null when no product is provided', () => {
        const {container} = render(<Metadata />)
        expect(container.firstChild).toBeNull()
    })

    test('returns null when product is null', () => {
        const {container} = render(<Metadata product={null} />)
        expect(container.firstChild).toBeNull()
    })

    test('renders Seo component with basic product data', () => {
        const product = {
            pageTitle: 'Test Product',
            pageDescription: 'Test Description',
            pageKeywords: 'test, product, keywords'
        }

        const {getByTestId} = render(<Metadata product={product} />)
        const seoElement = getByTestId('seo')
        const props = JSON.parse(seoElement.getAttribute('data-props'))

        expect(props.title).toBe('Test Product')
        expect(props.description).toBe('Test Description')
        expect(props.keywords).toBe('test, product, keywords')
        expect(props.metaTags).toEqual([])
    })

    test('uses pageMetaTags when available', () => {
        const product = {
            pageTitle: 'Test Product',
            pageDescription: 'Default Description',
            pageKeywords: 'default, keywords',
            pageMetaTags: [
                {id: 'description', value: 'Meta Tag Description'},
                {id: 'keywords', value: 'meta, tag, keywords'},
                {id: 'custom', value: 'custom value'}
            ]
        }

        const {getByTestId} = render(<Metadata product={product} />)
        const seoElement = getByTestId('seo')
        const props = JSON.parse(seoElement.getAttribute('data-props'))

        expect(props.title).toBe('Test Product')
        expect(props.description).toBe('Meta Tag Description')
        expect(props.keywords).toBe('meta, tag, keywords')
        expect(props.metaTags).toEqual(product.pageMetaTags)
    })

    test('falls back to product fields when pageMetaTags do not contain description or keywords', () => {
        const product = {
            pageTitle: 'Test Product',
            pageDescription: 'Fallback Description',
            pageKeywords: 'fallback, keywords',
            pageMetaTags: [{id: 'custom', value: 'custom value'}]
        }

        const {getByTestId} = render(<Metadata product={product} />)
        const seoElement = getByTestId('seo')
        const props = JSON.parse(seoElement.getAttribute('data-props'))

        expect(props.title).toBe('Test Product')
        expect(props.description).toBe('Fallback Description')
        expect(props.keywords).toBe('fallback, keywords')
        expect(props.metaTags).toEqual(product.pageMetaTags)
    })

    test('handles missing product fields gracefully', () => {
        const product = {}

        const {getByTestId} = render(<Metadata product={product} />)
        const seoElement = getByTestId('seo')
        const props = JSON.parse(seoElement.getAttribute('data-props'))

        expect(props.title).toBeUndefined()
        expect(props.description).toBeUndefined()
        expect(props.keywords).toBeUndefined()
        expect(props.metaTags).toEqual([])
    })

    test('handles empty pageMetaTags array', () => {
        const product = {
            pageTitle: 'Test Product',
            pageDescription: 'Test Description',
            pageKeywords: 'test, keywords',
            pageMetaTags: []
        }

        const {getByTestId} = render(<Metadata product={product} />)
        const seoElement = getByTestId('seo')
        const props = JSON.parse(seoElement.getAttribute('data-props'))

        expect(props.title).toBe('Test Product')
        expect(props.description).toBe('Test Description')
        expect(props.keywords).toBe('test, keywords')
        expect(props.metaTags).toEqual([])
    })

    test('prioritizes pageMetaTags over product fields for description and keywords', () => {
        const product = {
            pageTitle: 'Test Product',
            pageDescription: 'Product Description',
            pageKeywords: 'product, keywords',
            pageMetaTags: [
                {id: 'description', value: 'Meta Description'},
                {id: 'keywords', value: 'meta, keywords'},
                {id: 'other', value: 'other value'}
            ]
        }

        const {getByTestId} = render(<Metadata product={product} />)
        const seoElement = getByTestId('seo')
        const props = JSON.parse(seoElement.getAttribute('data-props'))

        expect(props.description).toBe('Meta Description')
        expect(props.keywords).toBe('meta, keywords')
        expect(props.metaTags).toEqual(product.pageMetaTags)
    })
})
