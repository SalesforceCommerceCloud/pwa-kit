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

    it('prioritizes description from pageMetaTags over pageDescription', () => {
        const product = {
            pageDescription: 'This should be ignored',
            pageMetaTags: [
                {id: 'description', value: 'This description should be used'},
                {id: 'keywords', value: 'product, amazing, quality'}
            ]
        }
        render(<Metadata product={product} />)

        const helmet = Helmet.peek()
        expect(helmet.metaTags).toContainEqual({
            name: 'description',
            content: 'This description should be used'
        })
        expect(helmet.metaTags).toContainEqual({
            name: 'keywords',
            content: 'product, amazing, quality'
        })
    })

    it('renders additional meta tags from pageMetaTags', () => {
        const product = {
            pageMetaTags: [
                {id: 'keywords', value: 'product, test, quality'},
                {id: 'author', value: 'Salesforce'},
                {id: 'robots', value: 'index, follow'}
            ]
        }
        render(<Metadata product={product} />)

        const helmet = Helmet.peek()
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

    it('filters out description tag from additional meta tags to avoid duplication', () => {
        const product = {
            pageMetaTags: [
                {id: 'description', value: 'Custom description'},
                {id: 'keywords', value: 'product, test'}
            ]
        }
        render(<Metadata product={product} />)

        const helmet = Helmet.peek()
        const descriptionTags = helmet.metaTags.filter(tag => tag.name === 'description')
        expect(descriptionTags).toHaveLength(1)
        expect(descriptionTags[0].content).toBe('Custom description')
    })

    it('renders complete metadata with all product properties', () => {
        const product = {
            pageTitle: 'Complete Product Title',
            pageDescription: 'This should be overridden',
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
            pageMetaTags: []
        }
        render(<Metadata product={product} />)

        const helmet = Helmet.peek()
        expect(helmet.title).toBe('Test Product')
        expect(helmet.metaTags).toEqual([
            {
                name: 'description',
                content: 'View detailed information, specifications, and features for this product.'
            }
        ])
    })
})
