/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {Box, Image, Img, Text, AspectRatio, useTheme} from '@chakra-ui/react'
import {Link} from 'react-router-dom'

import {isServer} from '../../utils/utils'

import {ChevronRightIcon} from '../icons'

/**
 * BasicTile component is used on content pages like home page.
 * This component is used to promote categories, it consistents
 * of an image and a category title link.
 */
const BasicTile = ({img, href, title, ...props}) => {
    const {src, alt} = img
    const theme = useTheme()
    return (
        <Box {...props}>
            <Box paddingBottom="4">
                <Link to={href}>
                    <AspectRatio ratio={3 / 4} display={isServer ? 'block' : 'none'}>
                        {/* Server Image */}
                        <Img
                            alt={alt}
                            src={src}
                            borderRadius="base"
                            bgGradient={theme.gradients.imageBackground}
                        />
                    </AspectRatio>
                    <AspectRatio ratio={3 / 4} display={isServer ? 'none' : 'block'}>
                        {/* Client Image */}
                        <Image
                            alt={alt}
                            src={src}
                            ignoreFallback={true}
                            borderRadius="base"
                            bgGradient={theme.gradients.imageBackground}
                        />
                    </AspectRatio>
                </Link>
            </Box>
            <Box>
                <Link to={href}>
                    <Text
                        fontWeight="bold"
                        _hover={{
                            textDecoration: 'underline'
                        }}
                    >
                        {title}
                        <ChevronRightIcon />
                    </Text>
                </Link>
            </Box>
        </Box>
    )
}

BasicTile.displayName = 'BasicTile'

BasicTile.propTypes = {
    href: PropTypes.string.isRequired,
    img: PropTypes.shape({
        src: PropTypes.string,
        alt: PropTypes.string
    }).isRequired,
    title: PropTypes.string.isRequired
}

export default BasicTile
