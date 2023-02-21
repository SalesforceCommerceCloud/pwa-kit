/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {Image, Box, Text, Link} from '@chakra-ui/react'
import DOMPurify from 'dompurify'

/**
 * Image with text component
 *
 * @param ITCLink Image Link.
 * @param ITCText Text Below Image.
 * @param image Image.
 * @param heading Text Overlay.
 * @param alt The image alt text shown by the component.
 * @returns {JSX.Element}
 */
const ImageWithText = ({ITCLink, ITCText, image, heading, alt}) => {
    const [sanitizedHtml, setSainitizedHtml] = useState(null)

    useEffect(() => {
        const purify = DOMPurify(window)
        const cleanHeading = purify.sanitize(heading)
        const cleanITCText = purify.sanitize(ITCText)
        setSainitizedHtml({heading: cleanHeading, ITCText: cleanITCText})
    }, [])

    return (
        <div className={'image-with-text'}>
            <Box
                as="figure"
                className={'image-with-text-figure'}
                position={'relative'}
                margin={0}
                width={'100%'}
            >
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
                            filter={'brightness(40%)'}
                        />
                    </Link>
                </picture>
                {(ITCText || heading) && (
                    <Text as="figcaption">
                        {heading && (
                            <Box
                                className={'image-with-text-heading-container'}
                                position={'absolute'}
                                top={'50%'}
                                width={'100%'}
                            >
                                <Text
                                    as="span"
                                    className={'image-with-text-heading-text'}
                                    color={'white'}
                                >
                                    <Box
                                        dangerouslySetInnerHTML={{
                                            __html: sanitizedHtml?.heading
                                        }}
                                        sx={{
                                            p: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }
                                        }}
                                    />
                                </Text>
                            </Box>
                        )}
                        {ITCText && (
                            <Box>
                                <Text as="span" className={'image-with-text-text-underneath'}>
                                    <Box
                                        dangerouslySetInnerHTML={{
                                            __html: sanitizedHtml?.ITCText
                                        }}
                                        sx={{
                                            p: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }
                                        }}
                                    />
                                </Text>
                            </Box>
                        )}
                    </Text>
                )}
            </Box>
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
