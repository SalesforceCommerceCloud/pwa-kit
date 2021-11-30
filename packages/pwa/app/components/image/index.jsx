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

/**
 * @param {Object} props
 * @param {string} props.src
 * @param {number[]} props.vwSizes
 * @param {(string[]|Object|string)} props.sizes
 * @param {(number[]|string)} props.srcSet
 * @return {Object} props for Chakra image component
 */
const getImageProps = ({src, vwSizes, sizes: _sizes, srcSet: _srcSet, ...otherProps}) => {
    const imageProps = {src: getSrcWithoutOptionalParams(src)}

    if (vwSizes) {
        const sizes = mapVwSizesToSizes(vwSizes)
        const srcSet = mapVwSizesToSrcSet(vwSizes)
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
 * @param {(string[]|Object|string)} sizes
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
 * @param {(number[]|Object)} vwSizes
 */
const mapVwSizesToSizes = (vwSizes) => {
    return Array.isArray(vwSizes)
        ? vwSizes.map((size) => `${size}vw`)
        : responsivePropAsArray(vwSizes)
}

/**
 * @param {(number[]|Object)} vwSizes
 */
const mapVwSizesToSrcSet = (vwSizes) => {
    let sizes = Array.isArray(vwSizes) ? vwSizes.slice() : responsivePropAsArray(vwSizes)

    if (sizes.length < breakpointLabels.length) {
        const lastSize = sizes[sizes.length - 1]
        const amountToPad = breakpointLabels.length - sizes.length

        sizes = [...sizes, ...Array(amountToPad).fill(lastSize)]
    }

    const srcSet = []
    sizes.forEach((size, i) => {
        if (i === sizes.length - 1) {
            return
        }

        const nextBp = breakpointLabels[i + 1]
        const em = (size / 100) * parseFloat(theme.breakpoints[nextBp])
        const px = emToPx(em)

        srcSet.push(px)
        srcSet.push(px * 2) // for devices with higher pixel density
    })

    return srcSet
}

/**
 * @param {Object} prop
 */
const responsivePropAsArray = (prop) => {
    let mostRecent
    return breakpointLabels.map((bp) => {
        if (prop[bp]) {
            mostRecent = prop[bp]
            return prop[bp]
        } else {
            return mostRecent
        }
    })
}

/**
 * @param {number} em
 * @param {number} browserDefaultFontSize
 */
const emToPx = (em, browserDefaultFontSize = 16) => Math.round(em * browserDefaultFontSize)

/**
 * @param {string} srcFormat
 * @param {number} imageWidth
 * @example
 * // returns https://example.com/image_720.jpg
 * getSrc('https://example.com/image[_{width}].jpg', 720)
 */
const getSrc = (srcFormat, imageWidth) => {
    // 1. remove the surrounding []
    // 2. replace {...} with imageWidth
    return srcFormat.replace(/\[([^\]]+)\]/g, '$1').replace(/\{[^}]+\}/g, imageWidth)
}

/**
 * @param {string} srcFormat
 */
const getSrcWithoutOptionalParams = (srcFormat) => {
    const optionalParams = /\[[^\]]+\]/g
    return srcFormat.replace(optionalParams, '')
}
