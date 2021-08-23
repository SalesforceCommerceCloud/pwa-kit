/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {AspectRatio, Box, Flex, Heading, Img, Text, VStack, useTheme} from '@chakra-ui/react'

const Hero = ({title, label, img, actions, ...props}) => {
    const {src, alt} = img
    const theme = useTheme()

    return (
        <Box height={{lg: 'xl'}} position={{lg: 'relative'}} {...props}>
            <Flex
                marginBottom="8"
                bgGradient={theme.gradients.imageBackground}
                justifyContent={{lg: 'flex-end'}}
                height="full"
                paddingRight={{lg: '16'}}
                borderRadius="base"
            >
                <AspectRatio ratio={1} width="full" maxWidth={{lg: 'lg'}}>
                    <Img alt={alt} src={src} />
                </AspectRatio>
            </Flex>
            <VStack
                alignItems="flex-start"
                position={{lg: 'absolute'}}
                top={{lg: '50%'}}
                transform={{lg: 'translateY(-50%)'}}
                paddingLeft={{lg: '16'}}
            >
                <Text fontSize={{base: 'sm', lg: 'md'}} fontWeight="semibold">
                    {label}
                </Text>
                <Heading
                    as="h1"
                    fontSize={{base: '4xl', lg: '5xl'}}
                    maxWidth={{base: '75%', md: '50%', lg: 'md'}}
                >
                    {title}
                </Heading>
                {actions && (
                    <Box paddingTop="2" width={{base: 'full', lg: 'inherit'}}>
                        {actions}
                    </Box>
                )}
            </VStack>
        </Box>
    )
}

Hero.displayName = 'Hero'

Hero.propTypes = {
    /**
     * Promotion label
     */
    label: PropTypes.string,
    /**
     * Hero component image
     */
    img: PropTypes.shape({
        src: PropTypes.string,
        alt: PropTypes.string
    }),
    /**
     * Hero component main title
     */
    title: PropTypes.string,
    /**
     * Call to action component(s)
     */
    actions: PropTypes.element
}

export default Hero
