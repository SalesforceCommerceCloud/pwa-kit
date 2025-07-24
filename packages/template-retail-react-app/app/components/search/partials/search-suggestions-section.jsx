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
import HorizontalSuggestions from '@salesforce/retail-react-app/app/components/search/partials/horizontal-suggestions'
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
    }
})

const SuggestionSection = ({searchSuggestions, closeAndNavigate, styles}) => {
    const hasCategories = searchSuggestions?.categorySuggestions?.length
    const hasProducts = searchSuggestions?.productSuggestions?.length

    return (
        <Fragment>
            <Box display="flex" gap="4" minH="280px">
                <Box flex="1">
                    {hasCategories && (
                        <Fragment>
                            <Box {...styles.sectionHeader}>
                                <FormattedMessage {...messages.categories} />
                            </Box>
                            <Suggestions
                                closeAndNavigate={closeAndNavigate}
                                suggestions={searchSuggestions?.categorySuggestions}
                            />
                        </Fragment>
                    )}
                </Box>
                <Box flex="3">
                    {hasProducts && (
                        <Fragment>
                            <HorizontalSuggestions
                                closeAndNavigate={closeAndNavigate}
                                suggestions={searchSuggestions?.productSuggestions}
                            />
                        </Fragment>
                    )}
                </Box>
            </Box>
        </Fragment>
    )
}

SuggestionSection.propTypes = {
    searchSuggestions: PropTypes.object.isRequired,
    closeAndNavigate: PropTypes.func.isRequired,
    styles: PropTypes.object.isRequired
}

export default SuggestionSection
