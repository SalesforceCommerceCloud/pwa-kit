/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Text, Button, Box, Flex, Image} from '@salesforce/retail-react-app/app/components/shared/ui'

const HorizontalSuggestions = ({suggestions, closeAndNavigate}) => {
    if (!suggestions) {
        return null
    }

    return (
        <Box data-testid="sf-horizontal-product-suggestions">
            <Flex gap="4" overflowX="auto" pb="2">
                {suggestions.map((suggestion, idx) => (
                    <Button
                        key={idx}
                        variant="unstyled"
                        onMouseDown={() => closeAndNavigate(suggestion.link)}
                        minW="200px"
                        maxW="200px"
                        textAlign="left"
                        p="0"
                        minH="280px"
                    >
                        <Box>
                            {/* Product Image */}
                            <Box position="relative" mb="2" minH="200px">
                                {suggestion.image && (
                                    <Image
                                        src={suggestion.image}
                                        alt={suggestion.name}
                                        width="200px"
                                        height="200px"
                                        objectFit="cover"
                                        borderRadius="md"
                                    />
                                )}
                                {/* Heart icon for favorites - positioned top right */}
                                <Box
                                    position="absolute"
                                    top="2"
                                    right="2"
                                    color="gray.500"
                                    fontSize="lg"
                                >
                                    ♡
                                </Box>

                                {suggestion.isNew && (
                                    <Box
                                        position="absolute"
                                        top="2"
                                        left="2"
                                        bg="blue.500"
                                        color="white"
                                        px="2"
                                        py="1"
                                        borderRadius="sm"
                                        fontSize="xs"
                                        fontWeight="bold"
                                    >
                                        New
                                    </Box>
                                )}
                            </Box>

                            <Text
                                fontSize="sm"
                                fontWeight="medium"
                                color="gray.900"
                                mb="1"
                                noOfLines={2}
                            >
                                {suggestion.name}
                            </Text>

                            {suggestion.price && (
                                <Text fontSize="sm" color="gray.900" fontWeight="medium">
                                    ${suggestion.price}
                                </Text>
                            )}
                        </Box>
                    </Button>
                ))}
            </Flex>
        </Box>
    )
}

HorizontalSuggestions.propTypes = {
    suggestions: PropTypes.array,
    closeAndNavigate: PropTypes.func
}

export default HorizontalSuggestions
