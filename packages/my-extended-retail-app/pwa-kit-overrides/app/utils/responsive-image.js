/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import theme from '@chakra-ui/theme'

/**
 * @param {Object} breakpoints
 * @return {string[]} Breakpoint labels ordered from smallest. For example: ['base', 'sm', 'md', 'lg', 'xl', '2xl']
 */
const getBreakpointLabels = (breakpoints) =>
    Object.entries(breakpoints)
        .sort((a, b) => parseFloat(a[1]) - parseFloat(b[1]))
        .map(([key]) => key)

const {breakpoints: defaultBreakpoints} = theme
let themeBreakpoints = defaultBreakpoints
let breakpointLabels = getBreakpointLabels(themeBreakpoints)

/**
 * @param {Object} props
 * @param {string} props.src - Dynamic src having an optional param that can vary with widths. For example: `image[_{width}].jpg` or `image.jpg[?sw={width}&q=60]`
 * @param {(number[]|string[]|Object)} [props.widths] - Image widths relative to the breakpoints, whose units can either be px or vw or unit-less. They will be mapped to the corresponding `sizes` and `srcSet`.
 * @param {Object} [props.breakpoints] - The current theme's breakpoints. If not given, Chakra's default breakpoints will be used.
 * @return {Object} src, sizes, and srcSet props for your image component
 */
export const getResponsiveImageAttributes = ({src, widths, breakpoints = defaultBreakpoints}) => {
    if (!widths) {
        return {
            src: getSrcWithoutOptionalParams(src)
        }
    }

    themeBreakpoints = breakpoints
    breakpointLabels = getBreakpointLabels(themeBreakpoints)

    return {
        src: getSrcWithoutOptionalParams(src),
        sizes: mapWidthsToSizes(widths),
        srcSet: mapWidthsToSrcSet(widths, src)
    }
}

/**
 * @param {(number[]|string[]|Object)} widths
 * @return {string}
 */
const mapWidthsToSizes = (widths) => {
    const _widths = withUnit(Array.isArray(widths) ? widths : widthsAsArray(widths))

    return breakpointLabels
        .slice(0, _widths.length)
        .map((bp, i) => {
            return i === 0 ? _widths[i] : `(min-width: ${themeBreakpoints[bp]}) ${_widths[i]}`
        })
        .reverse()
        .join(', ')
}

/**
 * @param {(number[]|string[]|Object)} widths
 * @return {string}
 */
const mapWidthsToSrcSet = (widths, dynamicSrc) => {
    let _widths = isObject(widths) ? widthsAsArray(widths) : widths.slice(0)

    if (_widths.length < breakpointLabels.length) {
        const lastWidth = _widths[_widths.length - 1]
        const amountToPad = breakpointLabels.length - _widths.length

        _widths = [..._widths, ...Array(amountToPad).fill(lastWidth)]
    }

    _widths = uniqueArray(convertToPxNumbers(_widths)).sort()

    const srcSet = []
    _widths.forEach((width) => {
        srcSet.push(width)
        srcSet.push(width * 2) // for devices with higher pixel density
    })

    return srcSet.map((imageWidth) => `${getSrc(dynamicSrc, imageWidth)} ${imageWidth}w`).join(', ')
}

const vwValue = /^\d+vw$/
const pxValue = /^\d+px$/

/**
 * @param {string[]|number[]} widths
 * @return {number[]}
 */
const convertToPxNumbers = (widths) => {
    return widths
        .map((width, i) => {
            if (typeof width === 'number') {
                return width
            }

            if (vwValue.test(width)) {
                const vw = parseFloat(width)
                const currentBp = breakpointLabels[i]
                // We imagine the biggest image for the current breakpoint
                // to be when the viewport is closely approaching the _next breakpoint_.
                const nextBp = breakpointLabels[i + 1]

                if (nextBp) {
                    return vwToPx(vw, nextBp)
                } else {
                    // We're already at the last breakpoint
                    return widths[i] !== widths[i - 1] ? vwToPx(vw, currentBp) : undefined
                }
            } else if (pxValue.test(width)) {
                return parseInt(width)
            } else {
                console.error('Expecting to see values with vw or px unit only')
                return 0
            }
        })
        .filter((width) => width !== undefined)
}

const uniqueArray = (array) => [...new Set(array)]

/**
 * @param {(number[]|string[])} widths
 */
const withUnit = (widths) =>
    // By default, unitless value is interpreted as px
    widths.map((width) => (typeof width === 'number' ? `${width}px` : width))

const isObject = (o) => o?.constructor === Object

/**
 * @param {Object} widths
 * @example
 * // returns the array [10, 10, 10, 50]
 * widthsAsArray({base: 10, lg: 50})
 */
const widthsAsArray = (widths) => {
    const biggestBreakpoint = breakpointLabels.filter((bp) => Boolean(widths[bp])).pop()

    let mostRecent
    return breakpointLabels.slice(0, breakpointLabels.indexOf(biggestBreakpoint) + 1).map((bp) => {
        if (widths[bp]) {
            mostRecent = widths[bp]
            return widths[bp]
        } else {
            return mostRecent
        }
    })
}

/**
 * @param {number} vw
 * @param {string} breakpoint
 */
const vwToPx = (vw, breakpoint) => {
    let result = (vw / 100) * parseFloat(themeBreakpoints[breakpoint])
    const breakpointsDefinedInPx = Object.values(themeBreakpoints).some((val) => pxValue.test(val))

    // Assumes theme's breakpoints are defined in either em or px
    // See https://chakra-ui.com/docs/features/responsive-styles#customizing-breakpoints
    return breakpointsDefinedInPx ? result : emToPx(result)
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
 * @example
 * // Returns 'https://example.com/image.jpg'
 * getSrcWithoutOptionalParams('https://example.com/image.jpg[?sw={width}]')
 */
const getSrcWithoutOptionalParams = (dynamicSrc) => {
    const optionalParams = /\[[^\]]+\]/g
    return dynamicSrc.replace(optionalParams, '')
}
