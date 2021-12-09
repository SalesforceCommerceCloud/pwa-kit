/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Img as ChakraImg, Box} from '@chakra-ui/react'
import {getResponsiveImageAttributes} from '../../utils/responsive-image'

// TODO: `as` prop
// TODO: example on how to use the component
const DynamicImage = ({src, widths, imageProps, ...rest}) => {
    return (
        <Box {...rest}>
            <ChakraImg {...getResponsiveImageAttributes({src, widths})} {...imageProps} />
        </Box>
    )
}

DynamicImage.propTypes = {
    src: PropTypes.string,
    widths: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    imageProps: PropTypes.object
}

export default DynamicImage
