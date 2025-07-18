/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {
    Text,
    Button,
    Stack,
    Box,
    Flex,
    Image,
    useMultiStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'

const Suggestions = ({suggestions, closeAndNavigate}) => {
    const styles = useMultiStyleConfig('SearchSuggestions')

    if (!suggestions) {
        return null
    }
    return (
        <Stack {...styles.suggestionsContainer} data-testid="sf-suggestion">
            <Box {...styles.suggestionsBox}>
                {suggestions.map((suggestion, idx) => (
                    <Button
                        {...styles.suggestionButton}
                        onMouseDown={() => closeAndNavigate(suggestion.link)}
                        key={idx}
                    >
                        <Flex align="center">
                            {/* Reserve space for image for all, but only render if present */}
                            <Box {...styles.imageContainer}>
                                {(suggestion.type === 'product' ||
                                    suggestion.type === 'category') &&
                                    suggestion.image && (
                                        <Image
                                            src={suggestion.image}
                                            alt=""
                                            {...styles.suggestionImage}
                                        />
                                    )}
                            </Box>
                            <Box {...styles.textContainer}>
                                <Text {...styles.suggestionName}>{suggestion.name}</Text>
                                {/* For categories, show parentCategoryName if present */}
                                {suggestion.type === 'category' &&
                                    suggestion.parentCategoryName && (
                                        <Text {...styles.categoryParent}>
                                            {' '}
                                            <FormattedMessage
                                                defaultMessage=" in "
                                                id="search_suggestions.category.in_parent"
                                            />
                                            {' ' + suggestion.parentCategoryName}
                                        </Text>
                                    )}
                            </Box>
                        </Flex>
                    </Button>
                ))}
            </Box>
        </Stack>
    )
}

Suggestions.propTypes = {
    suggestions: PropTypes.array,
    closeAndNavigate: PropTypes.func
}

export default Suggestions
