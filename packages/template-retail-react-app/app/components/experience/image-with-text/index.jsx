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
 *
 */
const ImageWithText = ({image}) => {
    return (
        <div className={'image-with-text'}>
            <figure className={'image-with-text-figure'}>
                <picture>
                    <source srcSet={image?.src?.tablet} media="(min-width: 48em)" />
                    <source srcSet={image?.src?.desktop} media="(min-width: 64em)" />
                    <Image
                        className={'image-with-text-image'}
                        data-testid={'image-with-text-image'}
                        src={image?.src?.mobile ? image?.src?.mobile : image?.url}
                        ignoreFallback={true}
                        alt={image?.alt}
                        title={image?.alt}
                    />
                </picture>
            </figure>
        </div>
    )
}

ImageWithText.propTypes = {
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

export default ImageWithText
