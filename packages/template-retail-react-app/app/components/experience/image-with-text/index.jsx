/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Image, Box, Text, Link} from '@chakra-ui/react'

/**
 *
 */
const ImageWithText = ({ITCLink, ITCText, image, heading, alt}) => {
    return (
        <div className={'image-with-text'}>
            <figure className={'image-with-text-figure'}>
                <picture>
                    <source srcSet={image?.src?.tablet} media="(min-width: 48em)" />
                    <source srcSet={image?.src?.desktop} media="(min-width: 64em)" />
                    <Link to={ITCLink}>
                        <Image
                            className={'image-with-text-image'}
                            data-testid={'image-with-text-image'}
                            src={image?.src?.mobile ? image?.src?.mobile : image?.url}
                            ignoreFallback={true}
                            alt={alt}
                            title={alt}
                        />
                    </Link>
                </picture>
                {(ITCText || heading) && (
                    <Text as="figcaption">
                        {heading && (
                            <Box className={'image-with-text-heading-container'}>
                                <Text as="span" className={'image-with-text-heading-text'}>
                                    {heading}
                                </Text>
                            </Box>
                        )}
                        {ITCText && (
                            <Box>
                                <Text as="span" className={'image-with-text-text-underneath'}>
                                    {ITCText}
                                </Text>
                            </Box>
                        )}
                    </Text>
                )}
            </figure>
        </div>
    )
}

ImageWithText.propTypes = {
    ITCLink: PropTypes.string,
    ITCText: PropTypes.string,
    image: PropTypes.shape({
        _type: PropTypes.string,
        focalPoint: PropTypes.shape({
            _type: PropTypes.string,
            x: PropTypes.number,
            y: PropTypes.number
        }),
        metaData: PropTypes.shape({
            _type: PropTypes.string,
            height: PropTypes.number,
            width: PropTypes.number
        }),
        url: PropTypes.string,
        src: PropTypes.string || PropTypes.object
    }),
    heading: PropTypes.string,
    alt: PropTypes.string
}

export default ImageWithText
