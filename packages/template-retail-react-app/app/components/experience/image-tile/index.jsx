/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {AspectRatio, Image} from '@chakra-ui/react'

/**
 * This is a simple Image Tile component that can be used inside any Layout component
 *
 * @param imageProps
 * @param ratio
 * @returns {JSX.Element}
 */
const ImageTile = ({imageProps, ratio = 1, ...rest}) => {
    return (
        <AspectRatio ratio={ratio}>
            <figure className={'photo-tile-figure'}>
                <picture>
                    <source srcSet={imageProps.src?.tablet} media="(min-width: 48em)" />
                    <source srcSet={imageProps.src?.desktop} media="(min-width: 64em)" />
                    <Image
                        className={'photo-tile-image image-fluid'}
                        src={imageProps.src?.mobile ? imageProps.src?.mobile : imageProps.src}
                        ignoreFallback={true}
                        alt={imageProps.alt}
                        title={imageProps.title}
                        {...rest}
                    />
                </picture>
            </figure>
        </AspectRatio>
    )
}

ImageTile.propTypes = {
    imageProps: PropTypes.object,
    ratio: PropTypes.number,
    caption: PropTypes.string
}

export default ImageTile
