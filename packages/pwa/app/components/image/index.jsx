/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Image as ChakraImage, Img as ChakraImg} from '@chakra-ui/react'
import theme from '@chakra-ui/theme'

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

export const Image = ({src, vwSizes, sizes, srcSet, ...otherProps}) => {
    return <ChakraImage {...getImageProps({src, vwSizes, sizes, srcSet, ...otherProps})} />
}
Image.propTypes = propTypes

export const Img = ({src, vwSizes, sizes, srcSet, ...otherProps}) => {
    return <ChakraImg {...getImageProps({src, vwSizes, sizes, srcSet, ...otherProps})} />
}
Img.propTypes = propTypes

// TODO: move these functions into util
// TODO: try the above components (and see if there's any error)

/**
 * @param {Object} props
 * @param {string} props.src
 * @param {number[]} props.vwSizes
 * @param {(string[]|object|string)} props.sizes
 * @param {(number[]|string)} props.srcSet
 * @return {Object} props for Chakra image component
 */
const getImageProps = ({src, vwSizes, sizes: _sizes, srcSet: _srcSet, ...otherProps}) => {
    const imageProps = {src: getSrcWithoutOptionalParams(src)}

    if (vwSizes) {
        const {sizes, srcSet} = mapVwSizesToSizesAndSrcSet(vwSizes)
        imageProps.sizes = convertSizesToHTMLAttribute(sizes)
        imageProps.srcSet = convertSrcSetToHTMLAttribute(srcSet, src)

        if (vwSizes && _sizes && _srcSet) {
            console.error('Cannot pass in sizes and srcSet when you already have specified vwSizes')
        }
    }

    if (_sizes) {
        imageProps.sizes = convertSizesToHTMLAttribute(_sizes)
    }
    if (_srcSet) {
        imageProps.srcSet = convertSrcSetToHTMLAttribute(_srcSet, src)
    }

    return {
        ...imageProps,
        ...otherProps
    }
}

/**
 * @param {(string[]|object|string)} sizes
 */
const convertSizesToHTMLAttribute = (sizes) => {
    if (typeof sizes === 'string') {
        return sizes
    }

    // Convert to object first if needed
    let _sizes = {}
    if (Array.isArray(sizes)) {
        sizes.forEach((size, i) => {
            const key = breakpointLabels[i]
            _sizes[key] = size
        })
    } else {
        _sizes = sizes
    }

    // Then convert all sizes into string
    const bp = theme.breakpoints
    const s = []
    _sizes['2xl'] && s.push(`(min-width: ${bp['2xl']}) ${_sizes['2xl']}`)
    _sizes.xl && s.push(`(min-width: ${bp.xl}) ${_sizes.xl}`)
    _sizes.lg && s.push(`(min-width: ${bp.lg}) ${_sizes.lg}`)
    _sizes.md && s.push(`(min-width: ${bp.md}) ${_sizes.md}`)
    _sizes.sm && s.push(`(min-width: ${bp.sm}) ${_sizes.sm}`)
    _sizes.base && s.push(_sizes.base)

    return s.join(', ')
}

const breakpointLabels = ['base', 'sm', 'md', 'lg', 'xl', '2xl']

/**
 * @param {(number[]|string)} srcSet
 * @param {string} srcFormat
 */
const convertSrcSetToHTMLAttribute = (srcSet, srcFormat) => {
    if (typeof srcSet === 'string') {
        return srcSet
    }

    const s = srcSet.map((imageWidth) => `${getSrc(srcFormat, imageWidth)} ${imageWidth}w`)
    return s.join(', ')
}

/**
 * @param {number[]} vwSizes
 */
const mapVwSizesToSizesAndSrcSet = (vwSizes) => {
    // TODO
    return {
        sizes: ['100vw', '100vw', '50vw', '350px'],
        srcSet: [300, 720, 1000, 1500]
    }
}

// TODO: https://example.com/image[_{width}].jpg => https://example.com/image_720.jpg
/**
 * @param {string} srcFormat
 * @param {number} imageWidth
 */
const getSrc = (srcFormat, imageWidth) => {
    // TODO: remove the surrounding []
    // TODO: replace {} with imageWidth
    return `https://example.com/image_${imageWidth}.jpg`
}

/**
 * @param {string} srcFormat
 */
const getSrcWithoutOptionalParams = (srcFormat) => {
    const optionalParams = /\[[^[\]]+\]/g
    return srcFormat.replace(optionalParams, '')
}
