/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {Stack} from '@chakra-ui/react'
import RecentSearches from './recent-searches'
import Suggestions from './suggestions'

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
