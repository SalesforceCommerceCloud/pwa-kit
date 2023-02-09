/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Image} from '@chakra-ui/react'

/**
 * This is a simple Image Tile component that can be used inside any Layout component
 * @param image Object containing the image url, _type and focalPoint.
 * @param rest The rest of the potential image parameters.
 * @returns {JSX.Element}
 */
const ImageTile = ({image, ...rest}) => {
    return (
        <figure data-testid="image-tile" className={'image-tile-figure'}>
            <picture>
                <source srcSet={rest.src?.tablet} media="(min-width: 48em)" />
                <source srcSet={rest.src?.desktop} media="(min-width: 64em)" />
                <Image
                    className={'image-tile-image'}
                    src={rest.src?.mobile ? rest.src?.mobile : image?.url}
                    ignoreFallback={true}
                    alt={rest?.alt}
                    title={rest?.title}
                    {...rest}
                />
            </picture>
        </figure>
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
        url: PropTypes.string
    })
}

export default ImageTile
