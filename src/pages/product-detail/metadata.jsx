/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Helmet} from 'react-helmet'
import PropTypes from 'prop-types'

/**
 * Metadata component for the product detail page.
 * @param {Object} product - The product object
 * @param {string} product.pageTitle - The title of the product
 * @param {string} product.pageDescription - The description of the product
 * @param {Array} product.pageMetaTags - The meta tags of the product
 * @param {Object} product.pageMetaTags.id - The id of the meta tag
 * @param {string} product.pageMetaTags.value - The value of the meta tag
 */
export default function Metadata({product}) {
    const defaultTitle = 'Product Detail Page'
    const defaultDescription = 'View detailed information, specifications, and features for this product.'
    const title = product?.pageTitle ?? defaultTitle
    const metaTags = product?.pageMetaTags || []
    const tags = metaTags.filter((tag) => tag.id !== 'description')
    const description = metaTags.find((tag) => tag.id === 'description')?.value || product?.pageDescription || defaultDescription
    
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />

            {tags.map(({id, value}) => (
                <meta name={id} content={value} key={id} />
            ))}
        </Helmet>
    )
}

Metadata.propTypes = {
    product: PropTypes.shape({
        pageTitle: PropTypes.string,
        pageDescription: PropTypes.string,
        pageMetaTags: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.string.isRequired,
                value: PropTypes.string.isRequired
            })
        )
    }).isRequired
}
