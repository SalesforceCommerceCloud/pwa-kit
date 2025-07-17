/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {Stack, Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import RecentSearches from '@salesforce/retail-react-app/app/components/search/partials/recent-searches'
import Suggestions from '@salesforce/retail-react-app/app/components/search/partials/suggestions'
import {FormattedMessage} from 'react-intl'

const HEADER_MARGIN_LEFT = 52
const SECTION_HEADER_STYLE = {
    fontWeight: 200,
    margin: '8px 0 4px 0',
    marginLeft: HEADER_MARGIN_LEFT,
    color: 'gray.500',
    fontSize: 'sm',
    lineHeight: 1.2
}
const SearchSuggestions = ({recentSearches, searchSuggestions, closeAndNavigate}) => {
    const hasCategories = searchSuggestions?.categorySuggestions?.length
    const hasProducts = searchSuggestions?.productSuggestions?.length
    const hasBrands = searchSuggestions?.brandSuggestions?.length
    const hasSuggestions = hasCategories || hasProducts || hasBrands
    return (
        <Stack padding={6} spacing={0}>
            {hasSuggestions ? (
                <Fragment>
                    {hasProducts && (
                        <>
                            <div style={SECTION_HEADER_STYLE}>
                                <FormattedMessage
                                    id="search.suggestions.products"
                                    defaultMessage="Products"
                                />
                            </div>
                            <Suggestions
                                closeAndNavigate={closeAndNavigate}
                                suggestions={searchSuggestions?.productSuggestions}
                            />
                        </>
                    )}
                    {hasCategories && (
                        <>
                            <div style={{...SECTION_HEADER_STYLE, margin: '8px 0 4px 0'}}>
                                <FormattedMessage
                                    id="search.suggestions.categories"
                                    defaultMessage="Categories"
                                />
                            </div>
                            <Suggestions
                                closeAndNavigate={closeAndNavigate}
                                suggestions={searchSuggestions?.categorySuggestions}
                            />
                        </>
                    )}
                    {hasBrands && (
                        <>
                            <div style={{...SECTION_HEADER_STYLE, margin: '8px 0 4px 0'}}>
                                <FormattedMessage
                                    id="search.suggestions.brands"
                                    defaultMessage="Brands"
                                />
                            </div>
                            <Suggestions
                                closeAndNavigate={closeAndNavigate}
                                suggestions={searchSuggestions?.brandSuggestions}
                            />
                        </>
                    )}
                </Fragment>
            ) : (
                <RecentSearches
                    recentSearches={recentSearches}
                    closeAndNavigate={closeAndNavigate}
                />
            )}
        </Stack>
    )
}

SearchSuggestions.propTypes = {
    recentSearches: PropTypes.array,
    searchSuggestions: PropTypes.object,
    closeAndNavigate: PropTypes.func
}

export default SearchSuggestions
