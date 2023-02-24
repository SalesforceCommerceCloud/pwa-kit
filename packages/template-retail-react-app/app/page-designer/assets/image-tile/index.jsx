/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Box, Image} from '@chakra-ui/react'

/**
 * Simple ImageTile component that can be used inside any Layout component.
 * @param image Object containing the image url, _type and focalPoint.
 * @returns {JSX.Element}
 */
export const ImageTile = ({image}) => {
    return (
        <Box className={'image-tile'}>
            <figure className={'image-tile-figure'}>
                <picture>
                    <source srcSet={image?.src?.tablet} media="(min-width: 48em)" />
                    <source srcSet={image?.src?.desktop} media="(min-width: 64em)" />
                    <Image
                        className={'image-tile-image'}
                        data-testid={'image-tile-image'}
                        src={image?.src?.mobile ? image?.src?.mobile : image?.url}
                        ignoreFallback={true}
                        alt={image?.alt}
                        title={image?.alt}
                    />
                </picture>
            </figure>
        </Box>
    )
}

ImageTile.propTypes = {
    image: PropTypes.shape({
        _type: PropTypes.string,
        focalPoint: PropTypes.shape({
            _type: PropTypes.string,
            x: PropTypes.number,
            y: PropTypes.number
        }),
        url: PropTypes.string,
        alt: PropTypes.string,
        src: PropTypes.string || PropTypes.object
    })
}

export default ImageTile
