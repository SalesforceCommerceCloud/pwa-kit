/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import Seo from '../../components/seo'

/**
 * Metadata component for the product detail page.
 * @param {Object} product - The product object
 * @param {string} product.pageTitle - The title of the product
 * @param {string} product.pageDescription - The description of the product
 * @param {string} product.pageKeywords - The keywords of the product
 * @param {Array} product.pageMetaTags - The meta tags of the product
 * @param {string} product.pageMetaTags.id - The id of the meta tag
 * @param {string} product.pageMetaTags.value - The value of the meta tag
 */
export default function PageMetadata({product}) {
    if (!product) {
        return null
    }

    const metaTags = product.pageMetaTags || []
    const title = product.pageTitle
    const keywords = metaTags.find((tag) => tag.id === 'keywords')?.value || product.pageKeywords
    const description =
        metaTags.find((tag) => tag.id === 'description')?.value || product.pageDescription

    return <Seo title={title} description={description} keywords={keywords} metaTags={metaTags} />
}

PageMetadata.propTypes = {
    product: PropTypes.shape({
        pageTitle: PropTypes.string,
        pageDescription: PropTypes.string,
        pageKeywords: PropTypes.string,
        pageMetaTags: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.string.isRequired,
                value: PropTypes.string.isRequired
            })
        )
    })
}
