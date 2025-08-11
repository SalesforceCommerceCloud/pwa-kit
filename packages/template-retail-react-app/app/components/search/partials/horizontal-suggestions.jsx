/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Text, Box, Flex, AspectRatio} from '@salesforce/retail-react-app/app/components/shared/ui'
import DynamicImage from '@salesforce/retail-react-app/app/components/dynamic-image'
import Link from '@salesforce/retail-react-app/app/components/link'

const HorizontalSuggestions = ({suggestions, closeAndNavigate, dynamicImageProps}) => {
    if (!suggestions) {
        return null
    }

    return (
        <Box data-testid="sf-horizontal-product-suggestions">
            <Flex gap="4" overflowX="auto" pb="2">
                {suggestions.map((suggestion, idx) => (
                    <Link
                        data-testid="product-tile"
                        to={suggestion.link}
                        key={idx}
                        onClick={() => closeAndNavigate(suggestion.link)}
                    >
                        <Box width={{base: '50vw', md: '50vw', lg: '15vw'}} flex="0 0 auto">
                            {/* Product Image */}
                            <Box mb="2">
                                {suggestion.image ? (
                                    <AspectRatio ratio={1}>
                                        <DynamicImage
                                            src={`${suggestion.image}[?sw={width}&q=60]`}
                                            widths={dynamicImageProps?.widths}
                                            sx={{
                                                height: '100%',
                                                width: '100%',
                                                '& picture': {
                                                    display: 'block',
                                                    height: '100%',
                                                    width: '100%'
                                                },
                                                '& img': {
                                                    display: 'block',
                                                    height: '100%',
                                                    width: '100%',
                                                    objectFit: 'cover'
                                                }
                                            }}
                                            imageProps={{
                                                alt: '',
                                                loading: 'eager'
                                            }}
                                        />
                                    </AspectRatio>
                                ) : null}
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
                    </Link>
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
