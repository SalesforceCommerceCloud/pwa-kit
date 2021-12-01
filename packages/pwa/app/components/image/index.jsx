/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Image as ChakraImage, Img as ChakraImg} from '@chakra-ui/react'
import {getResponsiveImageAttributes} from '../../utils/responsive-image'

const propTypes = {
    src: PropTypes.string,
    vwSizes: PropTypes.arrayOf(PropTypes.number),
    sizes: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.object,
        PropTypes.string
    ]),
    srcSet: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.string])
}

export const Image = ({src, vwSizes, sizes, srcSet, ...rest}) => {
    return (
        <ChakraImage {...rest} {...getResponsiveImageAttributes({src, vwSizes, sizes, srcSet})} />
    )
}
Image.propTypes = propTypes

export const Img = ({src, vwSizes, sizes, srcSet, ...rest}) => {
    return <ChakraImg {...rest} {...getResponsiveImageAttributes({src, vwSizes, sizes, srcSet})} />
}
Img.propTypes = propTypes
