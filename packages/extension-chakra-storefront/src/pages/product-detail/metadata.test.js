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
        return (
            <div data-testid="mock-seo" data-props={JSON.stringify(props)}>
                Mock SEO Component
            </div>
        )
    }
})

describe('Metadata', () => {
    it('renders with default values when product has no metadata', () => {
        const product = {}
        const {getByTestId} = render(<Metadata product={product} />)
        
        const seoComponent = getByTestId('mock-seo')
        const props = JSON.parse(seoComponent.getAttribute('data-props'))
        
        expect(props.title).toBe('Product Detail Page')
        expect(props.description).toBe('View detailed information, specifications, and features for this product.')
        expect(props.keywords).toBe('')
        expect(props.metaTags).toEqual([])
    })

    it('renders with product pageTitle when provided', () => {
        const product = {
            pageTitle: 'Amazing Product - Best Quality'
        }
        const {getByTestId} = render(<Metadata product={product} />)
        
        const seoComponent = getByTestId('mock-seo')
        const props = JSON.parse(seoComponent.getAttribute('data-props'))
        
        expect(props.title).toBe('Amazing Product - Best Quality')
    })

    it('renders with product pageDescription when provided', () => {
        const product = {
            pageDescription: 'This is an amazing product with great features.'
        }
        const {getByTestId} = render(<Metadata product={product} />)
        
        const seoComponent = getByTestId('mock-seo')
        const props = JSON.parse(seoComponent.getAttribute('data-props'))
        
        expect(props.description).toBe('This is an amazing product with great features.')
    })

    it('renders with product pageKeywords when provided', () => {
        const product = {
            pageKeywords: 'product, amazing, quality'
        }
        const {getByTestId} = render(<Metadata product={product} />)
        
        const seoComponent = getByTestId('mock-seo')
        const props = JSON.parse(seoComponent.getAttribute('data-props'))
        
        expect(props.keywords).toBe('product, amazing, quality')
    })

    it('passes empty keywords when no keywords are provided', () => {
        const product = {
            pageTitle: 'Test Product'
        }
        const {getByTestId} = render(<Metadata product={product} />)
        
        const seoComponent = getByTestId('mock-seo')
        const props = JSON.parse(seoComponent.getAttribute('data-props'))
        
        expect(props.keywords).toBe('')
    })

    it('prioritizes keywords from pageMetaTags over pageKeywords', () => {
        const product = {
            pageKeywords: 'This should be ignored',
            pageMetaTags: [
                {id: 'keywords', value: 'meta, tags, priority'}
            ]
        }
        const {getByTestId} = render(<Metadata product={product} />)
        
        const seoComponent = getByTestId('mock-seo')
        const props = JSON.parse(seoComponent.getAttribute('data-props'))
        
        expect(props.keywords).toBe('meta, tags, priority')
        expect(props.metaTags).toEqual([
            {id: 'keywords', value: 'meta, tags, priority'}
        ])
    })

    it('prioritizes description from pageMetaTags over pageDescription', () => {
        const product = {
            pageDescription: 'This should be ignored',
            pageMetaTags: [
                {id: 'description', value: 'This description should be used'},
                {id: 'author', value: 'Test Author'}
            ]
        }
        const {getByTestId} = render(<Metadata product={product} />)
        
        const seoComponent = getByTestId('mock-seo')
        const props = JSON.parse(seoComponent.getAttribute('data-props'))
        
        expect(props.description).toBe('This description should be used')
        expect(props.metaTags).toEqual([
            {id: 'description', value: 'This description should be used'},
            {id: 'author', value: 'Test Author'}
        ])
    })

    it('passes all meta tags from pageMetaTags to SEO component', () => {
        const product = {
            pageMetaTags: [
                {id: 'keywords', value: 'product, test, quality'},
                {id: 'description', value: 'Custom description'},
                {id: 'author', value: 'Salesforce'},
                {id: 'robots', value: 'index, follow'}
            ]
        }
        const {getByTestId} = render(<Metadata product={product} />)
        
        const seoComponent = getByTestId('mock-seo')
        const props = JSON.parse(seoComponent.getAttribute('data-props'))
        
        expect(props.description).toBe('Custom description')
        expect(props.keywords).toBe('product, test, quality')
        expect(props.metaTags).toEqual([
            {id: 'keywords', value: 'product, test, quality'},
            {id: 'description', value: 'Custom description'},
            {id: 'author', value: 'Salesforce'},
            {id: 'robots', value: 'index, follow'}
        ])
    })

    it('handles complete metadata with all product properties', () => {
        const product = {
            pageTitle: 'Complete Product Title',
            pageDescription: 'Fallback description',
            pageKeywords: 'fallback, keywords',
            pageMetaTags: [
                {id: 'description', value: 'Custom meta description'},
                {id: 'keywords', value: 'complete, product, test'},
                {id: 'author', value: 'Test Author'},
                {id: 'viewport', value: 'width=device-width, initial-scale=1'}
            ]
        }
        const {getByTestId} = render(<Metadata product={product} />)
        
        const seoComponent = getByTestId('mock-seo')
        const props = JSON.parse(seoComponent.getAttribute('data-props'))
        
        expect(props.title).toBe('Complete Product Title')
        expect(props.description).toBe('Custom meta description')
        expect(props.keywords).toBe('complete, product, test')
        expect(props.metaTags).toEqual([
            {id: 'description', value: 'Custom meta description'},
            {id: 'keywords', value: 'complete, product, test'},
            {id: 'author', value: 'Test Author'},
            {id: 'viewport', value: 'width=device-width, initial-scale=1'}
        ])
    })

    it('handles empty pageMetaTags array', () => {
        const product = {
            pageTitle: 'Test Product',
            pageKeywords: 'test, product',
            pageMetaTags: []
        }
        const {getByTestId} = render(<Metadata product={product} />)
        
        const seoComponent = getByTestId('mock-seo')
        const props = JSON.parse(seoComponent.getAttribute('data-props'))
        
        expect(props.title).toBe('Test Product')
        expect(props.description).toBe('View detailed information, specifications, and features for this product.')
        expect(props.keywords).toBe('test, product')
        expect(props.metaTags).toEqual([])
    })

    it('handles null/undefined product properties gracefully', () => {
        const product = {
            pageTitle: null,
            pageDescription: undefined,
            pageKeywords: null,
            pageMetaTags: undefined
        }
        const {getByTestId} = render(<Metadata product={product} />)
        
        const seoComponent = getByTestId('mock-seo')
        const props = JSON.parse(seoComponent.getAttribute('data-props'))
        
        expect(props.title).toBe('Product Detail Page')
        expect(props.description).toBe('View detailed information, specifications, and features for this product.')
        expect(props.keywords).toBe('')
        expect(props.metaTags).toEqual([])
    })
})
