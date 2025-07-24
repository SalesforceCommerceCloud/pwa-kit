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

const SuggestionSection = ({searchSuggestions, closeAndNavigate, styles}) => {
    const hasCategories = searchSuggestions?.categorySuggestions?.length
    const hasProducts = searchSuggestions?.productSuggestions?.length
    const hasPhraseSuggestions = searchSuggestions?.phraseSuggestions?.length

    return (
        <Fragment>
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
            {/* Mobile - Vertical alignment */}
            <HideOnDesktop>
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
            </HideOnDesktop>
            {/* Desktop - Horizontal alignment */}
            <HideOnMobile>
                <Box display="flex" gap="4" minH="230px">
                    <Box flex="1">
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
