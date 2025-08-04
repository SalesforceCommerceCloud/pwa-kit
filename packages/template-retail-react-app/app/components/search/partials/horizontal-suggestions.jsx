/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Text, Button, Box, Flex} from '@salesforce/retail-react-app/app/components/shared/ui'
import DynamicImage from '@salesforce/retail-react-app/app/components/dynamic-image'

const HorizontalSuggestions = ({suggestions, closeAndNavigate, dynamicImageProps}) => {
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
                        minW="30wv"
                        maxW="30wv"
                        textAlign="left"
                        p="0"
                        minH="280px"
                    >
                        <Box>
                            {/* Product Image */}
                            <Box position="relative" mb="2" minH="200px">
                                {suggestion.image && (
                                    <DynamicImage
                                        src={`${suggestion.image}[?sw={width}&q=60]`}
                                        widths={dynamicImageProps?.widths}
                                        imageProps={{
                                            // treat img as a decorative item, we don't need to pass `image.alt`
                                            // since it is the same as product name
                                            // which can cause confusion for individuals who uses screen readers
                                            alt: '',
                                            loading: 'lazy',
                                            ...dynamicImageProps?.imageProps
                                        }}
                                    />
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
    closeAndNavigate: PropTypes.func,
    dynamicImageProps: PropTypes.object
}

export default HorizontalSuggestions
