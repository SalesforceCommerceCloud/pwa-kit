/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {
    Text,
    Button,
    Stack,
    Box,
    Flex,
    Image
} from '@salesforce/retail-react-app/app/components/shared/ui'

const Suggestions = ({suggestions, closeAndNavigate}) => {
    if (!suggestions) {
        return null
    }
    return (
        <Stack spacing={0} data-testid="sf-suggestion">
            <Box mx={'-16px'} borderBottom="1px solid" borderColor="gray.200">
                {suggestions.map((suggestion, idx) => (
                    <Button
                        width="full"
                        onMouseDown={() => closeAndNavigate(suggestion.link)}
                        fontSize={'md'}
                        key={idx}
                        marginTop={0}
                        variant="menu-link"
                        style={{justifyContent: 'flex-start', padding: '8px 12px'}}
                    >
                        <Flex align="center">
                            {/* Reserve space for image for all, but only render if present */}
                            <Box
                                width="40px"
                                height="40px"
                                marginRight="16px"
                                borderRadius="full"
                                background="transparent"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                overflow="hidden"
                            >
                                {(suggestion.type === 'product' ||
                                    suggestion.type === 'category') &&
                                    suggestion.image && (
                                        <Image
                                            src={suggestion.image}
                                            alt=""
                                            boxSize="40px"
                                            borderRadius="full"
                                            objectFit="cover"
                                            background="#f3f3f3"
                                        />
                                    )}
                            </Box>
                            <Box textAlign="left">
                                <Text
                                    fontWeight={suggestion.type === 'brand' ? '700' : '500'}
                                    as="span"
                                    dangerouslySetInnerHTML={{__html: suggestion.name}}
                                />
                                {/* For categories, show parentCategoryName if present */}
                                {suggestion.type === 'category' &&
                                    suggestion.parentCategoryName && (
                                        <Text as="span" color="gray.500" fontSize="sm">
                                            {' in ' + suggestion.parentCategoryName}
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
