/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {AspectRatio, Image, Text} from '@chakra-ui/react'

/**
 *
 *
 */
const ImageAndText = ({imageProps, ratio = 1, ...props}) => {
    const {caption} = props

    return (
        <AspectRatio ratio={ratio}>
            <>
                <picture>
                    {/* Tablet */}
                    <source srcSet={imageProps.tablet} media="(min-width: 48em)" />
                    {/* Desktop */}
                    <source srcSet={imageProps.desktop} media="(min-width: 64em)" />
                    {/* Mobile */}
                    <Image
                        src={`${imageProps.disBaseLink || imageProps.link}`}
                        ignoreFallback={true}
                        alt={imageProps.alt}
                        {...imageProps}
                    />
                </picture>
                {caption && <Text as="figcaption">{caption}</Text>}
            </>
        </AspectRatio>
    )
}

ImageAndText.propTypes = {
    imageProps: PropTypes.object,
    ratio: PropTypes.number,
    caption: PropTypes.string
}

export default ImageAndText
