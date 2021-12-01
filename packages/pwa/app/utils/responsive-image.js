/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import theme from '@chakra-ui/theme'

/**
 * @param {Object} props
 * @param {string} props.src
 * @param {number[]} props.vwSizes - Sizes in vw unit, which will be mapped to sizes and srcSet attributes
 * @param {(string[]|Object|string)} props.sizes
 * @param {(number[]|string)} props.srcSet
 * @return {Object} src, sizes, and srcSet props for Chakra image component
 *
 * @example
 * // All of these are equivalent (similar to Chakra's responsive styles)
 * getResponsiveImageAttributes({vwSizes: [100, 100, 50]})
 * getResponsiveImageAttributes({vwSizes: {base: 100, md: 50}})
 * getResponsiveImageAttributes({sizes: {base: '100vw', md: '50vw'}, srcSet: [...]})
 */
export const getResponsiveImageAttributes = ({src, vwSizes, sizes: _sizes, srcSet: _srcSet}) => {
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

    return imageProps
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
        : responsivePropAsArray(vwSizes).map((size) => `${size}vw`)
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

        // We imagine the biggest image for the current breakpoint
        // to be when the viewport is closely approaching the _next breakpoint_.
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
 * @param {number} [browserDefaultFontSize]
 */
const emToPx = (em, browserDefaultFontSize = 16) => Math.round(em * browserDefaultFontSize)

/**
 * @param {string} srcFormat
 * @param {number} imageWidth
 * @return {string} Image url having the given width
 * @example
 * // returns https://example.com/image_720.jpg
 * getSrc('https://example.com/image[_{width}].jpg', 720)
 */
export const getSrc = (srcFormat, imageWidth) => {
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
