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
 * Metadata component for the product list page.
 * @param {Object} category - The category object
 * @param {string} category.pageTitle - The title of the category
 * @param {string} category.pageDescription - The description of the category
 * @param {string} category.pageKeywords - The keywords of the category
 * @param {string} searchQuery - The search query string
 * @param {Object} productSearchResult - The product search result object
 * @param {Array} productSearchResult.pageMetaTags - The meta tags from search result
 * @param {string} productSearchResult.pageMetaTags.id - The id of the meta tag
 * @param {string} productSearchResult.pageMetaTags.value - The value of the meta tag
 */
export default function Metadata({category, searchQuery, productSearchResult}) {
    if (category) {
        return (
            <Seo
                title={category.pageTitle}
                description={category.pageDescription}
                keywords={category.pageKeywords}
            />
        )
    }

    if (searchQuery) {
        const metaTags = productSearchResult?.pageMetaTags || []
        const searchTitle = searchQuery
        const searchDescription = metaTags.find((tag) => tag.id === 'description')?.value
        const searchKeywords = metaTags.find((tag) => tag.id === 'keywords')?.value

        return (
            <Seo
                title={searchTitle}
                description={searchDescription}
                keywords={searchKeywords}
                metaTags={metaTags}
            />
        )
    }

    return null
}

Metadata.propTypes = {
    category: PropTypes.shape({
        pageTitle: PropTypes.string,
        pageDescription: PropTypes.string,
        pageKeywords: PropTypes.string
    }),
    searchQuery: PropTypes.string,
    productSearchResult: PropTypes.shape({
        pageMetaTags: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.string.isRequired,
                value: PropTypes.string.isRequired
            })
        )
    })
}
