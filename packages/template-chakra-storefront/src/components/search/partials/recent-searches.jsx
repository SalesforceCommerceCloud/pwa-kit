/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {Text, Button, Box} from '@chakra-ui/react'

import {clearSessionJSONItem} from '../../../utils/utils'

import {useIntl} from 'react-intl'
import {searchUrlBuilder} from '../../../utils/url'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const RecentSearches = ({recentSearches, closeAndNavigate}) => {
    const {search: searchConfig} = getConfig()
    const intl = useIntl()
    const {formatMessage} = intl

    const messages = useMemo(
        () => ({
            recentSearchesTitle: intl.formatMessage({
                id: 'recent_searches.heading.recent_searches',
                defaultMessage: 'Recent Searches'
            }),
            clearRecentSearches: intl.formatMessage({
                id: 'recent_searches.action.clear_searches',
                defaultMessage: 'Clear recent searches'
            })
        }),
        [intl]
    )

    const clearSearches = () => {
        clearSessionJSONItem(searchConfig.recentSearchKey)
        closeAndNavigate(false)
    }
    return (
        <Box>
            {recentSearches?.length > 0 && (
                <Box>
                    <Text fontWeight="700" fontSize={'md'} data-testid="sf-suggestion-recent">
                        {messages.recentSearchesTitle}
                    </Text>
                    <Box mx={'-16px'}>
                        {recentSearches.map((recentSearch, idx) => (
                            <Button
                                width="full"
                                role="button"
                                name="recent-search"
                                fontSize={'md'}
                                key={idx}
                                onMouseDown={() => {
                                    closeAndNavigate(searchUrlBuilder(recentSearch))
                                }}
                                variant="menu-link"
                            >
                                <Text fontWeight="400">{recentSearch}</Text>
                            </Button>
                        ))}
                        <Button
                            data-testid="sf-clear-search"
                            id="clear-search"
                            width="full"
                            onMouseDown={() => {
                                clearSearches()
                            }}
                            variant="menu-link"
                        >
                            <Text fontWeight="400" color="blue.600" fontSize={'md'}>
                                {messages.clearRecentSearches}
                            </Text>
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    )
}

RecentSearches.propTypes = {
    recentSearches: PropTypes.array,
    closeAndNavigate: PropTypes.func
}

export default RecentSearches
