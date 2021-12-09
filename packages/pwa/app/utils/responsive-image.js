/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import theme from '@chakra-ui/theme'

// TODO: remove this
/**
 * @param {Object} props
 * @param {string} props.src - A responsive image's src needs to have optional param like this: `image[_{width}].jpg` or `image.jpg[?sw={width}&q=60]`
 * @param {(number[]|Object)} props.vwSizes - Sizes in vw unit (relative to Chakra's breakpoints), which will be mapped to sizes and srcSet attributes
 * @param {(string[]|Object|string)} props.sizes - Rules for browser to pick the appropriate size. If it's an array or object, its value will be relative to Chakra's breakpoints.
 * @param {(number[]|string)} props.srcSet - A set of images that are available for browser to download
 * @return {Object} src, sizes, and srcSet props for Chakra image component
 *
 * @example
 * // All of these arguments are equivalent (similar to Chakra's responsive styles)
 * ({src: 'http://a.com/image[_{width}].jpg', vwSizes: [100, 100, 50]})
 * ({src: 'http://a.com/image[_{width}].jpg', vwSizes: {base: 100, md: 50}})
 * ({src: 'http://a.com/image[_{width}].jpg', sizes: {base: '100vw', md: '50vw'}, srcSet: [...]})
 */
/*
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
*/

/**
 * @param {string} src
 * @param {(number[]|string[]|Object)} [widths]
 */
export const getResponsiveImageAttributes = ({src, widths}) => {
    if (!widths) {
        return {
            src: getSrcWithoutOptionalParams(src)
        }
    }

    return {
        src: getSrcWithoutOptionalParams(src),
        sizes: mapWidthsToSizes(widths),
        srcSet: mapWidthsToSrcSet(widths, src)
    }
}

/**
 * @param {(number[]|string[]|Object)} widths
 */
const mapWidthsToSizes = (widths) => {
    // By default, unit-less number is a px value
    const _widths = withUnit(Array.isArray(widths) ? widths : responsivePropAsArray(widths))

    return breakpointLabels
        .slice(0, _widths.length)
        .map((bp, i) => {
            return i === 0 ? _widths[i] : `(min-width: ${theme.breakpoints[bp]}) ${_widths[i]}`
        })
        .reverse()
        .join(', ')
}

/**
 * @param {(number[]|string[]|Object)} widths
 */
const mapWidthsToSrcSet = (widths, dynamicSrc) => {
    let _widths = isObject(widths) ? responsivePropAsArray(widths) : widths.slice(0)
    if (typeof _widths[0] === 'string') {
        _widths = convertToPxNumbers(_widths)
    }

    const srcSet = []
    _widths.forEach((width) => {
        srcSet.push(width)
        srcSet.push(width * 2) // for devices with higher pixel density
    })

    return srcSet.map((imageWidth) => `${getSrc(dynamicSrc, imageWidth)} ${imageWidth}w`).join(', ')
}

/**
 * @param {string[]} widths
 */
const convertToPxNumbers = (widths) => {
    const vwValue = /^\d+vw$/
    const pxValue = /^\d+px$/

    return widths.map((width, i) => {
        if (vwValue.test(width)) {
            const vw = parseFloat(width)
            // We imagine the biggest image for the current breakpoint
            // to be when the viewport is closely approaching the _next breakpoint_.
            // (If you're already at the last breakpoint, we'll use that instead)
            const nextBp = breakpointLabels[i + 1] || breakpointLabels[i]
            const em = (vw / 100) * parseFloat(theme.breakpoints[nextBp])
            return emToPx(em)
        } else if (pxValue.test(width)) {
            return parseInt(width)
        } else {
            console.error('Expecting to see values with vw or px unit only')
            return 0
        }
    })
}

/**
 * @param {(number[]|string[])} widths
 */
const withUnit = (widths) =>
    widths.map((width) => (typeof width === 'number' ? `${width}px` : width))

const isObject = (o) => o?.constructor === Object

const breakpointLabels = ['base', 'sm', 'md', 'lg', 'xl', '2xl']

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
 * @param {string} dynamicSrc
 * @param {number} imageWidth
 * @return {string} Image url having the given width
 * @example
 * // returns https://example.com/image_720.jpg
 * getSrc('https://example.com/image[_{width}].jpg', 720)
 */
export const getSrc = (dynamicSrc, imageWidth) => {
    // 1. remove the surrounding []
    // 2. replace {...} with imageWidth
    return dynamicSrc.replace(/\[([^\]]+)\]/g, '$1').replace(/\{[^}]+\}/g, imageWidth)
}

/**
 * @param {string} dynamicSrc
 */
const getSrcWithoutOptionalParams = (dynamicSrc) => {
    const optionalParams = /\[[^\]]+\]/g
    return dynamicSrc.replace(optionalParams, '')
}
