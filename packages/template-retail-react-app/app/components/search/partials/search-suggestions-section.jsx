/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import Suggestions from '@salesforce/retail-react-app/app/components/search/partials/suggestions'
import {FormattedMessage, defineMessages} from 'react-intl'

// required for React Intl's static message extraction
const messages = defineMessages({
    products: {
        id: 'search.suggestions.products',
        defaultMessage: 'Products'
    },
    categories: {
        id: 'search.suggestions.categories',
        defaultMessage: 'Categories'
    },
    brands: {
        id: 'search.suggestions.brands',
        defaultMessage: 'Brands'
    }
})

const SuggestionSection = ({searchSuggestions, closeAndNavigate, styles}) => {
    const hasCategories = searchSuggestions?.categorySuggestions?.length
    const hasProducts = searchSuggestions?.productSuggestions?.length
    const hasBrands = searchSuggestions?.brandSuggestions?.length

    const suggestionSections = [
        {
            hasData: hasProducts,
            message: messages.products,
            suggestions: searchSuggestions?.productSuggestions
        },
        {
            hasData: hasCategories,
            message: messages.categories,
            suggestions: searchSuggestions?.categorySuggestions
        },
        {
            hasData: hasBrands,
            message: messages.brands,
            suggestions: searchSuggestions?.brandSuggestions
        }
    ]

    return (
        <Fragment>
            {suggestionSections.map((section) => {
                if (!section.hasData) {
                    return null
                }

                return (
                    <Fragment key={section.message.id}>
                        <Box {...styles.sectionHeader}>
                            <FormattedMessage {...section.message} />
                        </Box>
                        <Suggestions
                            closeAndNavigate={closeAndNavigate}
                            suggestions={section.suggestions}
                        />
                    </Fragment>
                )
            })}
        </Fragment>
    )
}

SuggestionSection.propTypes = {
    searchSuggestions: PropTypes.object.isRequired,
    closeAndNavigate: PropTypes.func.isRequired,
    styles: PropTypes.object.isRequired
}

export default SuggestionSection
