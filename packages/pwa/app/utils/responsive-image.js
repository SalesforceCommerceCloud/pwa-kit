/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Image} from '@chakra-ui/react'
import theme from '@chakra-ui/theme'

/**
 * @param {Object} props
 * @param {string} props.src
 * @param {number[]} props.vwSizes
 * @param {(string[]|Object|string)} props.sizes
 * @param {(number[]|string)} props.srcSet
 * @return {Object} props for Chakra image component
 */
export const getImageProps = ({src, vwSizes, sizes: _sizes, srcSet: _srcSet, ...otherProps}) => {
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

// TODO: a simpler interface
// Scenarios:
// - DIS image
// - non-DIS image
// - pass in string values for srcSet, sizes
// - pass in object or array values for srcset, sizes
// - regular, non-responsive image

const FOO = () => {
    const DISImage = (
        <Image
            // With the special syntax `[{}]`, this `src` will be mapped to
            // the fallback src attribute (for old browser that doesn't support srcSet)
            // of "https://edge.disstg.commercecloud.salesforce.com/...jpg" (without ?sw=)
            src="https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1e4fcb17/images/large/PG.10212867.JJ3XYXX.PZ.jpg[?sw={width}&q=60]"
            // `vwSizes` will be automatically mapped to sizes and srcSet attributes
            // and thus less work for the users when implementing responsive images.

            // Why I chose this name?
            // - 'vw', because the values are in vw unit (not px)
            // - 'Sizes' and not width/srcset, because the values correspond to responsive breakpoints
            vwSizes={[100, 100, 100, 50]}
            // OR vwSizes={{base: 100, lg: 50}}
        />
    )

    // Flexible enough to support other kinds of image urls
    const nonDISImage = (
        <Image
            // This is a static bundled image
            src="https://example.com/image[_{width}].jpg" // e.g. image_720.jpg
            // While an image service allows us to use any sized images, we can't do that with static bundled images.
            // Thus we can't accept `vwSizes` here but we can let the users manually specify the sizes and srcSet.
            sizes={['100vw', '100vw', '50vw', '350px']} // Remember: sizes relate to Chakra breakpoints
            srcSet={[300, 720, 1000, 1500]} // srcSet values will be interpreted in px unit
        />
    )

    // Mimicking Chakra's style prop, you can pass in either object or array for `sizes`
    const sizesWithObjectOrArray = (
        <Image
            src="https://example.com/image[_{width}].jpg"
            sizes={{
                base: 'calc(100vw / 2)',
                md: `calc((100vw - 280px) / 3)`,
                '2xl': '387px'
            }}
            srcSet={[189, 567, 387, 774]}
        />
    )

    // Can pass in literal, handcrafted values
    const withLiteralValues = (
        <Image
            src="https://example.com/image.jpg"
            sizes="(min-width: 1200px) 800px, (min-width: 720px) 50vw, 100vw"
            srcSet="https://example.com/image_800.jpg 800w, https://example.com/image_1600.jpg 1600w"
        />
    )

    // No sizes or srcSet attributes? No problem.
    const nonResponsiveImage = <Image src="https://example.com/image.jpg" />
}
