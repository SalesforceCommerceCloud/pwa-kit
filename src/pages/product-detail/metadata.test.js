/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render} from '@testing-library/react'
import {Helmet} from 'react-helmet'
import Metadata from './metadata'

describe('Metadata', () => {
    afterEach(() => {
        Helmet.canUseDOM = false
    })

    beforeEach(() => {
        Helmet.canUseDOM = true
    })

    it('renders with default values when product has no metadata', () => {
        const product = {}
        render(<Metadata product={product} />)

        const helmet = Helmet.peek()
        expect(helmet.title).toBe('Product Detail Page')
        expect(helmet.metaTags).toEqual([
            {
                name: 'description',
                content: 'View detailed information, specifications, and features for this product.'
            }
        ])
    })

    it('renders with product pageTitle when provided', () => {
        const product = {
            pageTitle: 'Amazing Product - Best Quality'
        }
        render(<Metadata product={product} />)

        const helmet = Helmet.peek()
        expect(helmet.title).toBe('Amazing Product - Best Quality')
    })

    it('renders with product pageDescription when provided', () => {
        const product = {
            pageDescription: 'This is an amazing product with great features.'
        }
        render(<Metadata product={product} />)

        const helmet = Helmet.peek()
        expect(helmet.metaTags).toContainEqual({
            name: 'description',
            content: 'This is an amazing product with great features.'
        })
    })

    it('renders with product pageKeywords when provided', () => {
        const product = {
            pageKeywords: 'product, amazing, quality'
        }
        render(<Metadata product={product} />)

        const helmet = Helmet.peek()
        expect(helmet.metaTags).toContainEqual({
            name: 'keywords',
            content: 'product, amazing, quality'
        })
    })

    it('does not render keywords meta tag when no keywords are provided', () => {
        const product = {
            pageTitle: 'Test Product'
        }
        render(<Metadata product={product} />)

        const helmet = Helmet.peek()
        const keywordsTags = helmet.metaTags.filter(tag => tag.name === 'keywords')
        expect(keywordsTags).toHaveLength(0)
    })

    it('prioritizes keywords from pageMetaTags over pageKeywords', () => {
        const product = {
            pageKeywords: 'This should be ignored',
            pageMetaTags: [
                {id: 'keywords', value: 'meta, tags, priority'}
            ]
        }
        render(<Metadata product={product} />)

        const helmet = Helmet.peek()
        expect(helmet.metaTags).toContainEqual({
            name: 'keywords',
            content: 'meta, tags, priority'
        })
    })

    it('prioritizes description from pageMetaTags over pageDescription', () => {
        const product = {
            pageDescription: 'This should be ignored',
            pageMetaTags: [
                {id: 'description', value: 'This description should be used'},
                {id: 'author', value: 'Test Author'}
            ]
        }
        render(<Metadata product={product} />)

        const helmet = Helmet.peek()
        expect(helmet.metaTags).toContainEqual({
            name: 'description',
            content: 'This description should be used'
        })
        expect(helmet.metaTags).toContainEqual({
            name: 'author',
            content: 'Test Author'
        })
    })

    it('renders all meta tags from pageMetaTags including duplicates', () => {
        const product = {
            pageMetaTags: [
                {id: 'keywords', value: 'product, test, quality'},
                {id: 'description', value: 'Custom description'},
                {id: 'author', value: 'Salesforce'},
                {id: 'robots', value: 'index, follow'}
            ]
        }
        render(<Metadata product={product} />)

        const helmet = Helmet.peek()
        expect(helmet.metaTags).toContainEqual({
            name: 'description',
            content: 'Custom description'
        })
        expect(helmet.metaTags).toContainEqual({
            name: 'keywords',
            content: 'product, test, quality'
        })
        expect(helmet.metaTags).toContainEqual({
            name: 'author',
            content: 'Salesforce'
        })
        expect(helmet.metaTags).toContainEqual({
            name: 'robots',
            content: 'index, follow'
        })
    })

    it('handles duplicate meta tags when pageMetaTags contains description and keywords', () => {
        const product = {
            pageDescription: 'Fallback description',
            pageKeywords: 'fallback, keywords',
            pageMetaTags: [
                {id: 'description', value: 'Priority description'},
                {id: 'keywords', value: 'priority, keywords'}
            ]
        }
        render(<Metadata product={product} />)

        const helmet = Helmet.peek()
        // Should have both the conditional keywords/description AND the ones from pageMetaTags
        const descriptionTags = helmet.metaTags.filter(tag => tag.name === 'description')
        const keywordsTags = helmet.metaTags.filter(tag => tag.name === 'keywords')
        
        expect(descriptionTags).toHaveLength(2)
        expect(keywordsTags).toHaveLength(2)
        
        // The conditional ones should use the priority values from pageMetaTags
        expect(helmet.metaTags).toContainEqual({
            name: 'description',
            content: 'Priority description'
        })
        expect(helmet.metaTags).toContainEqual({
            name: 'keywords',
            content: 'priority, keywords'
        })
    })

    it('renders complete metadata with all product properties', () => {
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
        render(<Metadata product={product} />)

        const helmet = Helmet.peek()
        expect(helmet.title).toBe('Complete Product Title')
        expect(helmet.metaTags).toContainEqual({
            name: 'description',
            content: 'Custom meta description'
        })
        expect(helmet.metaTags).toContainEqual({
            name: 'keywords',
            content: 'complete, product, test'
        })
        expect(helmet.metaTags).toContainEqual({
            name: 'author',
            content: 'Test Author'
        })
        expect(helmet.metaTags).toContainEqual({
            name: 'viewport',
            content: 'width=device-width, initial-scale=1'
        })
    })

    it('handles empty pageMetaTags array', () => {
        const product = {
            pageTitle: 'Test Product',
            pageKeywords: 'test, product',
            pageMetaTags: []
        }
        render(<Metadata product={product} />)

        const helmet = Helmet.peek()
        expect(helmet.title).toBe('Test Product')
        expect(helmet.metaTags).toEqual([
            {
                name: 'description',
                content: 'View detailed information, specifications, and features for this product.'
            },
            {
                name: 'keywords',
                content: 'test, product'
            }
        ])
    })
})
