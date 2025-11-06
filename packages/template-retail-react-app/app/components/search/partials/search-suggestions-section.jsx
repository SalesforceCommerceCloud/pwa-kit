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
import {FormattedMessage} from 'react-intl'
import {HideOnDesktop, HideOnMobile} from '@salesforce/retail-react-app/app/components/responsive'
import Link from '@salesforce/retail-react-app/app/components/link'
import {searchUrlBuilder} from '@salesforce/retail-react-app/app/utils/url'

const SuggestionSection = ({searchSuggestions, closeAndNavigate, styles}) => {
    const hasCategories = searchSuggestions?.categorySuggestions?.length
    const hasProducts = searchSuggestions?.productSuggestions?.length
    const hasPhraseSuggestions = searchSuggestions?.phraseSuggestions?.length
    const hasPopularSearches = searchSuggestions?.popularSearchSuggestions?.length
    const hasRecentSearches = searchSuggestions?.recentSearchSuggestions?.length

    return (
        <Fragment>
            {/* Mobile - Vertical alignment */}
            <HideOnDesktop>
                {hasPhraseSuggestions &&
                    searchSuggestions?.phraseSuggestions[0].exactMatch === false && (
                        <Fragment>
                            <Box {...styles.textContainer}>
                                <FormattedMessage
                                    defaultMessage="Did you mean"
                                    id="search.suggestions.didYouMean"
                                />
                                <Link to={searchSuggestions?.phraseSuggestions[0].link}>
                                    {' ' + searchSuggestions?.phraseSuggestions[0].name + '?'}
                                </Link>
                            </Box>
                        </Fragment>
                    )}
                {hasCategories && (
                    <Fragment>
                        <Box {...styles.sectionHeader}>
                            <FormattedMessage
                                defaultMessage="Categories"
                                id="search.suggestions.categories"
                            />
                        </Box>
                        <Suggestions
                            closeAndNavigate={closeAndNavigate}
                            suggestions={searchSuggestions?.categorySuggestions}
                        />
                    </Fragment>
                )}
                {hasProducts && (
                    <Fragment>
                        <Box {...styles.sectionHeader}>
                            <FormattedMessage
                                defaultMessage="Products"
                                id="search.suggestions.products"
                            />
                        </Box>
                        <Suggestions
                            closeAndNavigate={closeAndNavigate}
                            suggestions={searchSuggestions?.productSuggestions}
                        />
                    </Fragment>
                )}
                {hasPopularSearches && (
                    <Fragment>
                        <Box {...styles.sectionHeader}>
                            <FormattedMessage
                                defaultMessage="Popular Searches"
                                id="search.suggestions.popular"
                            />
                        </Box>
                        <Suggestions
                            closeAndNavigate={closeAndNavigate}
                            suggestions={searchSuggestions?.popularSearchSuggestions}
                        />
                    </Fragment>
                )}
                {hasRecentSearches && (
                    <Fragment>
                        <Box {...styles.sectionHeader}>
                            <FormattedMessage
                                defaultMessage="Recent Searches"
                                id="search.suggestions.recent"
                            />
                        </Box>
                        <Suggestions
                            closeAndNavigate={closeAndNavigate}
                            suggestions={searchSuggestions?.recentSearchSuggestions}
                        />
                    </Fragment>
                )}
            </HideOnDesktop>
            {/* Desktop - Vertical and Horizontal alignment */}
            <HideOnMobile>
                <Box display="flex" gap="5">
                    <Box flex="1">
                        {hasPhraseSuggestions &&
                            searchSuggestions?.phraseSuggestions[0].exactMatch === false && (
                                <Fragment>
                                    <Box {...styles.phraseContainer} mb="4">
                                        <FormattedMessage
                                            defaultMessage="Did you mean"
                                            id="search.suggestions.didYouMean"
                                        />
                                        <Link to={searchSuggestions?.phraseSuggestions[0].link}>
                                            {' ' +
                                                searchSuggestions?.phraseSuggestions[0].name +
                                                '?'}
                                        </Link>
                                    </Box>
                                </Fragment>
                            )}
                        {hasCategories && (
                            <Fragment>
                                <Box {...styles.sectionHeader}>
                                    <FormattedMessage
                                        defaultMessage="Categories"
                                        id="search.suggestions.categories"
                                    />
                                </Box>
                                <Suggestions
                                    closeAndNavigate={closeAndNavigate}
                                    suggestions={searchSuggestions?.categorySuggestions}
                                />
                            </Fragment>
                        )}
                        {hasPopularSearches && (
                            <Fragment>
                                <Box {...styles.sectionHeader}>
                                    <FormattedMessage
                                        defaultMessage="Popular Searches"
                                        id="search.suggestions.popular"
                                    />
                                </Box>
                                <Suggestions
                                    closeAndNavigate={closeAndNavigate}
                                    suggestions={searchSuggestions?.popularSearchSuggestions}
                                />
                            </Fragment>
                        )}
                        {hasRecentSearches && (
                            <Fragment>
                                <Box {...styles.sectionHeader}>
                                    <FormattedMessage
                                        defaultMessage="Recent Searches"
                                        id="search.suggestions.recent"
                                    />
                                </Box>
                                <Suggestions
                                    closeAndNavigate={closeAndNavigate}
                                    suggestions={searchSuggestions?.recentSearchSuggestions}
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
                                    dynamicImageProps={{
                                        widths: ['50vw', '50vw', '16vw']
                                    }}
                                />
                            </Fragment>
                        )}
                    </Box>
                    <Box flex="1" display="flex" alignItems="center">
                        {hasProducts && (
                            <Fragment>
                                <Box textAlign="center" width="100%">
                                    <Link
                                        to={searchUrlBuilder(searchSuggestions?.searchPhrase || '')}
                                    >
                                        <FormattedMessage
                                            defaultMessage="View All"
                                            id="search.suggestions.viewAll"
                                        />
                                    </Link>
                                </Box>
                            </Fragment>
                        )}
                    </Box>
                </Box>
            </HideOnMobile>
        </Fragment>
    )
}

SuggestionSection.propTypes = {
    searchSuggestions: PropTypes.object.isRequired,
    closeAndNavigate: PropTypes.func.isRequired,
    styles: PropTypes.object.isRequired
}

export default SuggestionSection
