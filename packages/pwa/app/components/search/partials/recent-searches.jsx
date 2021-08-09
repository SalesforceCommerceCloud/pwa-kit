/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import PropTypes from 'prop-types'
import {Text, Button, Box} from '@chakra-ui/react'

import {clearSessionJSONItem} from '../../../utils/utils'
import {RECENT_SEARCH_KEY} from '../../../constants'

import {FormattedMessage} from 'react-intl'
import {searchUrlBuilder} from '../../../utils/url'

const RecentSearches = ({recentSearches, closeAndNavigate}) => {
    const clearSearches = () => {
        clearSessionJSONItem(RECENT_SEARCH_KEY)
        closeAndNavigate(false)
    }
    return (
        <Box>
            {recentSearches?.length > 0 && (
                <Box>
                    <Text fontWeight="700" fontSize={'md'} data-testid="sf-suggestion-recent">
                        <FormattedMessage defaultMessage="Recent Searches" />
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
                                <FormattedMessage defaultMessage="Clear recent searches" />
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
