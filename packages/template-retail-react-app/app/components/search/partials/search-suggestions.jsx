/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Stack} from '@chakra-ui/react'
import Suggestions from './suggestions'

const SearchSuggestions = ({searchSuggestions, closeAndNavigate}) => {
    return (
        <Stack padding={6} spacing={0}>
            <Suggestions
                closeAndNavigate={closeAndNavigate}
                suggestions={searchSuggestions?.categorySuggestions}
            />
            {/* <Suggestions
                closeAndNavigate={closeAndNavigate}
                suggestions={searchSuggestions?.phraseSuggestions}
            /> */}
            {/* <Suggestions
                closeAndNavigate={closeAndNavigate}
                suggestions={searchSuggestions.productSuggestions}
            /> */}
        </Stack>
    )
}

SearchSuggestions.propTypes = {
    searchSuggestions: PropTypes.object,
    closeAndNavigate: PropTypes.func
}

export default SearchSuggestions
