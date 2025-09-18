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
import {useStyleConfig} from '@chakra-ui/react'

const HorizontalSuggestions = ({suggestions, closeAndNavigate, dynamicImageProps}) => {
    const styles = useStyleConfig('HorizontalSuggestions')

    if (!suggestions) {
        return null
    }

    return (
        <Box data-testid="sf-horizontal-product-suggestions" sx={styles.container}>
            <Flex sx={styles.flexContainer}>
                {suggestions.map((suggestion, idx) => (
                    <Link
                        data-testid="product-tile"
                        to={suggestion.link}
                        key={idx}
                        onClick={() => closeAndNavigate(suggestion.link)}
                    >
                        <Box sx={styles.suggestionItem}>
                            {/* Product Image */}
                            <Box sx={styles.imageContainer}>
                                {suggestion.image ? (
                                    <AspectRatio sx={styles.aspectRatio}>
                                        <DynamicImage
                                            src={`${suggestion.image}[?sw={width}&q=60]`}
                                            widths={dynamicImageProps?.widths}
                                            sx={styles.dynamicImage}
                                            imageProps={{
                                                alt: '',
                                                loading: 'eager'
                                            }}
                                        />
                                    </AspectRatio>
                                ) : null}
                            </Box>

                            <Text sx={styles.productName}>{suggestion.name}</Text>

                            {suggestion.price && (
                                <Text sx={styles.productPrice}>${suggestion.price}</Text>
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
