/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import RecentSearches from '@salesforce/retail-react-app/app/components/search/partials/recent-searches'
import Suggestions from '@salesforce/retail-react-app/app/components/search/partials/suggestions'

const SearchSuggestions = ({recentSearches, searchSuggestions, closeAndNavigate}) => {
    const useSuggestions = searchSuggestions && searchSuggestions?.categorySuggestions?.length
    return (
        <Stack padding={6} spacing={0}>
            {useSuggestions ? (
                <Fragment>
                    <Suggestions
                        closeAndNavigate={closeAndNavigate}
                        suggestions={searchSuggestions?.categorySuggestions}
                    />
                    {/* <Suggestions
                        closeAndNavigate={closeAndNavigate}
                        suggestions={searchSuggestions?.phraseSuggestions}
                    /> */}
                    {/* <Suggestions suggestions={searchSuggestions.productSuggestions} /> */}
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
