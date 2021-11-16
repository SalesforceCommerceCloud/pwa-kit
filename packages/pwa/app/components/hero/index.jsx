/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Box, Flex, Heading, Stack, Image} from '@chakra-ui/react'

const Hero = ({title, img, actions, ...props}) => {
    const {src, alt} = img

    return (
        <Box height={{lg: 'xl'}} position={{lg: 'relative'}} {...props}>
            <Stack
                align={'center'}
                spacing={{base: 8, md: 10}}
                py={{base: 12, md: 10}}
                direction={{base: 'column', lg: 'row'}}
            >
                <Stack flex={1} spacing={{base: 5, md: 10}}>
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
                </Stack>
                <Flex
                    flex={1}
                    justify={'center'}
                    align={'center'}
                    position={'relative'}
                    w={'full'}
                    pt={{base: 12, lg: 0}}
                >
                    <Box position={'relative'} width={{base: 'full', md: '80%', lg: 'full'}}>
                        <Image
                            fit={'cover'}
                            align={'center'}
                            w={'100%'}
                            h={'100%'}
                            src={src}
                            alt={alt}
                        />
                    </Box>
                </Flex>
            </Stack>
        </Box>
    )
}

Hero.displayName = 'Hero'

Hero.propTypes = {
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
