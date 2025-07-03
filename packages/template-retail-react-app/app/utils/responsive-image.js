/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import theme from '@salesforce/retail-react-app/app/components/shared/theme'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'

/**
 * @param {Object} breakpoints
 * @return {string[]} Breakpoint labels ordered from smallest. For example: ['base', 'sm', 'md', 'lg', 'xl', '2xl']
 */
const getBreakpointLabels = (breakpoints) =>
    Object.entries(breakpoints)
        .sort((a, b) => parseFloat(a[1]) - parseFloat(b[1]))
        .map(([key]) => key)

const {breakpoints: defaultBreakpoints} = theme
const defaultDensityFactors = [
    [1, 1],
    [2, 2]
]
const getEffectiveDensities = (breakpoints) =>
    Object.entries(breakpoints)
        .sort((a, b) => parseFloat(a[1]) - parseFloat(b[1]))
        .map(() => defaultDensityFactors)

let themeBreakpoints = defaultBreakpoints
let breakpointLabels = getBreakpointLabels(themeBreakpoints)
let effectiveDefaultDensities = getEffectiveDensities(defaultBreakpoints)

// Init densities cache
const densitiesCache = new WeakMap()
densitiesCache.set(themeBreakpoints, new WeakMap())

/**
 * @param {Object} props
 * @param {string} props.src - Dynamic src having an optional param that can vary with widths. For example: `image[_{width}].jpg` or `image.jpg[?sw={width}&q=60]`
 * @param {(number[]|string[]|Object)} [props.widths] - Image widths relative to the breakpoints, whose units can either be px or vw or unit-less. They will be mapped to the corresponding `sizes` and `srcSet`.
 * @param {(number[]|[number, number][])} [props.densities] - Image density factors to apply relative to the breakpoints. Will be mapped to the corresponding `srcSet`.
 * @param {Object} [props.breakpoints] - The current theme's breakpoints. If not given, Chakra's default breakpoints will be used.
 * @return {Object} src, sizes, and srcSet props for your image component
 */
export const getResponsiveImageAttributes = ({
    src,
    widths,
    densities,
    breakpoints = defaultBreakpoints
}) => {
    if (!widths) {
        return {
            src: getSrcWithoutOptionalParams(src)
        }
    }

    if (breakpoints !== themeBreakpoints) {
        !densitiesCache.has(breakpoints) && densitiesCache.set(breakpoints, new WeakMap())
        themeBreakpoints = breakpoints
        breakpointLabels = getBreakpointLabels(themeBreakpoints)
        effectiveDefaultDensities = getEffectiveDensities(themeBreakpoints)
    }

    // Order of these attributes matter! If src is not last, Safari will refetch images
    // multiple times (once when it processes src and again when it processes sizes / srcSet)
    // See https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2223
    return {
        sizes: mapWidthsToSizes(widths),
        srcSet: mapWidthsToSrcSet({src, widths, densities}),
        src: getSrcWithoutOptionalParams(src)
    }
}

/**
 * @param {(number[]|string[]|Object)} widths
 * @return {string}
 */
const mapWidthsToSizes = (widths) => {
    const _widths = withUnit(Array.isArray(widths) ? widths : breakpointMapAsArray(widths))

    return breakpointLabels
        .slice(0, _widths.length)
        .map((bp, i) => {
            return i === 0 ? _widths[i] : `(min-width: ${themeBreakpoints[bp]}) ${_widths[i]}`
        })
        .reverse()
        .join(', ')
}

function padArray(arr) {
    const l1 = arr.length
    const l2 = breakpointLabels.length
    if (l1 < l2) {
        const lastEntry = arr.at(-1)
        const amountToPad = l2 - l1
        return [...arr, ...Array(amountToPad).fill(lastEntry)]
    }
    return arr
}

/**
 * @param {(number[]|[number, number][])} densities
 * @param {number[][][]} [collector]
 * @returns {number[][][]}
 */
function mapDensities(densities, collector) {
    const flat = Array.isArray(collector)
    return densities.reduce(
        (acc, entry) => {
            if (!flat && Array.isArray(entry) && Array.isArray(entry.at(0))) {
                acc.push(mapDensities(entry, []))
            } else if (
                Array.isArray(entry) &&
                typeof entry.at(0) === 'number' &&
                !Number.isNaN(entry.at(0))
            ) {
                const w = entry.at(0)
                const f = entry.at(1)
                const result = [w, typeof f === 'number' && !Number.isNaN(f) ? f : w]
                acc.push(flat ? result : [result])
            } else if (typeof entry === 'number' && !Number.isNaN(entry)) {
                const result = [entry, entry]
                acc.push(flat ? result : [result])
            } else if (flat) {
                acc.push(...defaultDensityFactors)
            } else {
                acc.push(defaultDensityFactors)
            }
            return acc
        },
        flat ? collector : []
    )
}

function obtainDensities(densities) {
    const cache = densitiesCache.get(themeBreakpoints)
    if (cache?.has(densities)) {
        return densitiesCache.get(themeBreakpoints).get(densities)
    } else if (isObject(densities)) {
        const _densities = mapDensities(padArray(breakpointMapAsArray(densities)))
        cache?.set(densities, _densities)
        return _densities
    } else if (Array.isArray(densities)) {
        const _densities = mapDensities(padArray(densities))
        cache?.set(densities, _densities)
        return _densities
    }
    return effectiveDefaultDensities
}

/**
 * @param {Object} props
 * @param {string} props.src
 * @param {(number[]|string[]|Object)} props.widths
 * @param {(number[]|[number, number][])} props.densities
 * @return {string}
 */
const mapWidthsToSrcSet = ({src, widths, densities}) => {
    let _widths = isObject(widths) ? breakpointMapAsArray(widths) : widths.slice(0)
    _widths = uniqueArray(convertToPxNumbers(padArray(_widths))).sort()

    // Request images using given or default density factors. By default, images are requested with factors 1 and 2.
    const _densities = obtainDensities(densities)
    const set = _widths.reduce((acc, width, idx) => {
        const densityFactors = _densities.at(idx)
        for (const [w, f] of densityFactors) {
            const w1 = Math.round(width * w)
            const w2 = Math.round(width * f)
            acc.add(`${getSrc(src, w2)} ${w1}w`)
        }
        return acc
    }, new Set())
    return [...set].join(', ')
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
                logger.error('Expecting to see values with vw or px unit only', {
                    namespace: 'utils.convertToPxNumbers'
                })
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
 * @param {Object} map
 * @example
 * // returns the array [10, 10, 10, 50]
 * breakpointMapAsArray({base: 10, lg: 50})
 */
const breakpointMapAsArray = (map) => {
    const biggestBreakpoint = breakpointLabels.filter((bp) => Boolean(map[bp])).pop()

    let mostRecent
    return breakpointLabels.slice(0, breakpointLabels.indexOf(biggestBreakpoint) + 1).map((bp) => {
        if (map[bp]) {
            mostRecent = map[bp]
            return map[bp]
        }
        return mostRecent
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
