/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Img,
    Text,
    AspectRatio,
    useTheme
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {Link} from 'react-router-dom'

import {ChevronRightIcon} from '@salesforce/retail-react-app/app/components/icons'

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
                    <AspectRatio ratio={3 / 4}>
                        <Img
                            alt={alt}
                            src={src}
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
