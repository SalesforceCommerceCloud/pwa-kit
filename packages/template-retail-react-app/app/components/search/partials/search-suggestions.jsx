/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Stack, useMultiStyleConfig} from '@salesforce/retail-react-app/app/components/shared/ui'
import RecentSearches from '@salesforce/retail-react-app/app/components/search/partials/recent-searches'
import SuggestionSection from '@salesforce/retail-react-app/app/components/search/partials/search-suggestions-section'
import AskAssistantBanner from '@salesforce/retail-react-app/app/components/search/partials/ask-assistant-banner'

const SearchSuggestions = ({
    recentSearches,
    searchSuggestions,
    closeAndNavigate,
    enableAgentFromSearchSuggestions,
    onAskAssistantClick
}) => {
    const styles = useMultiStyleConfig('SearchSuggestions')
    const hasCategories = searchSuggestions?.categorySuggestions?.length
    const hasProducts = searchSuggestions?.productSuggestions?.length
    const hasBrands = searchSuggestions?.brandSuggestions?.length
    const hasPopularSearches = searchSuggestions?.popularSearchSuggestions?.length
    const hasRecentSearches = searchSuggestions?.recentSearchSuggestions?.length
    const hasSuggestions =
        hasCategories || hasProducts || hasBrands || hasPopularSearches || hasRecentSearches
    const showAskAssistantBanner =
        enableAgentFromSearchSuggestions === 'true' || enableAgentFromSearchSuggestions === true

    return (
        <Stack {...styles.container}>
            {hasSuggestions ? (
                <SuggestionSection
                    searchSuggestions={searchSuggestions}
                    closeAndNavigate={closeAndNavigate}
                    styles={styles}
                    showAskAssistantBanner={showAskAssistantBanner}
                    onAskAssistantClick={onAskAssistantClick}
                />
            ) : (
                <>
                    <RecentSearches
                        recentSearches={recentSearches}
                        closeAndNavigate={closeAndNavigate}
                    />
                    {showAskAssistantBanner && onAskAssistantClick && (
                        <AskAssistantBanner onClick={onAskAssistantClick} styles={styles} />
                    )}
                </>
            )}
        </Stack>
    )
}

SearchSuggestions.propTypes = {
    recentSearches: PropTypes.array,
    searchSuggestions: PropTypes.object,
    closeAndNavigate: PropTypes.func,
    enableAgentFromSearchSuggestions: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    onAskAssistantClick: PropTypes.func
}

export default SearchSuggestions
