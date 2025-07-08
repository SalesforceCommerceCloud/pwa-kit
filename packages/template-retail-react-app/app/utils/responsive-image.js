/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import theme from '@salesforce/retail-react-app/app/components/shared/theme'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'

/**
 * An array of numbers, numeric tuples, or objects with breakpoint keys and values
 * that can either be numbers, numeric tuples, or arrays of numeric tuples.
 * @typedef {(number[] | [number, number][] | {base?: number | [number, number] | [number, number][], sm?: number | [number, number] | [number, number][], md?: number | [number, number] | [number, number][], lg?: number | [number, number] | [number, number][], xm?: number | [number, number] | [number, number][], '2xl'?: number | [number, number] | [number, number][]})} Densities
 */

/**
 * @param {Object} breakpoints
 * @return {string[]} Breakpoint labels ordered from smallest. For example: ['base', 'sm', 'md', 'lg', 'xl', '2xl']
 */
function getBreakpointLabels(breakpoints) {
    return Object.entries(breakpoints)
        .sort((a, b) => parseFloat(a[1]) - parseFloat(b[1]))
        .map(([key]) => key)
}

function getEffectiveDensities(breakpoints, factors) {
    return Object.entries(breakpoints)
        .sort((a, b) => parseFloat(a[1]) - parseFloat(b[1]))
        .map(() => factors)
}

const vwValue = /^\d+vw$/
const pxValue = /^\d+px$/
const emValue = /^\d+em$/

const {breakpoints: defaultBreakpoints} = theme
const defaultDensityFactors = [
    [1, 1],
    [2, 2]
]

let themeBreakpoints = defaultBreakpoints
let breakpointLabels = getBreakpointLabels(themeBreakpoints)
let effectiveDefaultDensities = getEffectiveDensities(defaultBreakpoints, defaultDensityFactors)

// Init densities cache
const densitiesCache = new WeakMap()
densitiesCache.set(themeBreakpoints, new WeakMap())

/**
 * Helper to create very specific `media` attributes for responsive preload purposes.
 * @param {number} breakpointIndex
 * @return {({min?: string, max?: string} | undefined)}
 * @see {@link https://web.dev/articles/preload-responsive-images#picture}
 */
function obtainImageLinkMedia(breakpointIndex) {
    const toMediaValue = (bp, type) => {
        const val = themeBreakpoints[bp]
        if (emValue.test(val)) {
            // em value
            const parsed = parseFloat(val)
            return {[type]: type === 'max' ? `${parsed - 0.01}em` : `${parsed}em`}
        }

        const parsed = parseInt(val, 10)
        return {[type]: type === 'max' ? `${parsed - 1}px` : `${parsed}px`}
    }

    const nextBp = breakpointLabels.at(breakpointIndex + 1)
    const currentBp = breakpointLabels.at(breakpointIndex)
    if (breakpointIndex === 0) {
        // first
        return toMediaValue(nextBp, 'max')
    } else if (breakpointIndex === breakpointLabels.length - 1) {
        // last
        return toMediaValue(currentBp, 'min')
    }
    return {...toMediaValue(currentBp, 'min'), ...toMediaValue(nextBp, 'max')}
}

/**
 * Ensures the mapping of various supported `densities` input types to
 * a unified internal output/representation that allows influencing an
 * image's effectively requested size as well as its display width.
 * The resulting data shape contains an array of numeric tuples, where
 * each tuple entry represents conversion factors to apply for certain
 * targeted theme breakpoints.
 *
 * At the end, the `densities` work in conjunction with the `widths`
 * property passed to the {@link getResponsivePictureAttributes} method
 * as well. While the `widths` define the visual space/size an image should
 * consume on the screen when a certain breakpoint matches, the `densities`
 * allow fine-granular control each image's properties.
 *
 * Per breakpoint, it's possible to define multiple density factor tuples.
 * In this way, several images can be defined per breakpoint, optimized to
 * be loaded by devices with different matching resolutions.
 *
 * The computation per theme breakpoint works as follows. Example for breakpoint
 * `lg` (80em):
 * 1. The related `widths` entry (e.g. `50vm`) is used to compute a `px` value.
 *    Example: 80 * 16 * 50vm = 1280 / 2 = 640 (`px`)
 * 2. The related `densities` factor entry (e.g. `[0.75, 1.5]`) is used to compute the final image dimensions.
 *    Example: display width = 640 * 0.75 = 480; DIS size = 640 * 2 = 960
 * 3. The resulting image definition then looks like `http://example.com/image.jpg?sw=960&q=60 480w`
 * @example Array of numeric values
 *   mapDensities([1, 2]) = [
 *       [[1, 1]], // base
 *       [[2, 2]], // sm
 *       [[2, 2]], // md
 *       [[2, 2]], // lg
 *       [[2, 2]], // xl
 *       [[2, 2]], // 2xl
 *   ]
 * @example Object with breakpoint keys and numeric values
 *   mapDensities({
 *       base: 1,
 *       sm: 2,
 *   }) = [
 *       [[1, 1]], // base
 *       [[2, 2]], // sm
 *       [[2, 2]], // md
 *       [[2, 2]], // lg
 *       [[2, 2]], // xl
 *       [[2, 2]], // 2xl
 *   ]
 * @example Array of tuple (and simple numeric) values
 *   mapDensities([[1, 0.5], 2, [2, 2.5], [2, 1.5]]) = [
 *       [[1, 0.5]], // base
 *       [[2, 2]], // sm
 *       [[2, 2.5]], // md
 *       [[2, 1.5]], // lg
 *       [[2, 1.5]], // xl
 *       [[2, 1.5]], // 2xl
 *   ]
 * @example Object with breakpoint keys and tuple (and simple numeric) values
 *   mapDensities({
 *       base: [1, 0.5],
 *       sm: 2,
 *       md: [2, 2.5],
 *       lg: [2, 1.5],
 *   }) = [
 *       [[1, 0.5]], // base
 *       [[2, 2]], // sm
 *       [[2, 2.5]], // md
 *       [[2, 1.5]], // lg
 *       [[2, 1.5]], // xl
 *       [[2, 1.5]], // 2xl
 *   ]
 * @example Object of tuple arrays
 *   mapDensities({
 *       base: [[1, 1], [2, 2]],
 *       xl: [[1, 0.75], [2, 1.5]],
 *   }) = [
 *       [[1, 1], [2, 2]], // base
 *       [[1, 1], [2, 2]], // sm
 *       [[1, 1], [2, 2]], // md
 *       [[1, 1], [2, 2]], // lg
 *       [[1, 0.75], [2, 1.5]], // xl
 *       [[1, 0.75], [2, 1.5]], // 2xl
 *   ]
 * @param {Densities} densities
 * @param {[number, number][][]} [collector]
 * @returns {[number, number][][]}
 * @see {@link getResponsivePictureAttributes}
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

/**
 * @param {Densities} densities
 * @returns {[number, number][][]}
 * @see {@link mapDensities}
 */
function getDensities(densities) {
    const cache = densitiesCache.get(themeBreakpoints)
    if (cache?.has(densities)) {
        return densitiesCache.get(themeBreakpoints).get(densities)
    } else if (isObject(densities)) {
        const _densities = mapDensities(padArray(mapWidthsToSizes(densities)))
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
 * @param {(number[]|string[])} widths
 */
function withUnit(widths) {
    // By default, unitless value is interpreted as px
    return widths.map((width) => (typeof width === 'number' ? `${width}px` : width))
}

function isObject(o) {
    return o?.constructor === Object
}

/**
 * @param {Object} widths
 * @example
 * // returns the array [10, 10, 10, 50]
 * mapWidthsToSizes({base: 10, lg: 50})
 */
function mapWidthsToSizes(widths) {
    const biggestBreakpoint = breakpointLabels.filter((bp) => Boolean(widths[bp])).pop()
    let mostRecent
    return breakpointLabels.slice(0, breakpointLabels.indexOf(biggestBreakpoint) + 1).map((bp) => {
        if (widths[bp]) {
            mostRecent = widths[bp]
            return widths[bp]
        }
        return mostRecent
    })
}

/**
 * @param {number} em
 * @param {number} [browserDefaultFontSize]
 */
function emToPx(em, browserDefaultFontSize = 16) {
    return Math.round(em * browserDefaultFontSize)
}

/**
 * @param {number} vw
 * @param {string} breakpoint
 */
function vwToPx(vw, breakpoint) {
    const result = (vw / 100) * parseFloat(themeBreakpoints[breakpoint])
    const breakpointsDefinedInPx = Object.values(themeBreakpoints).some((val) => pxValue.test(val))

    // Assumes theme's breakpoints are defined in either em or px
    // See https://chakra-ui.com/docs/features/responsive-styles#customizing-breakpoints
    return breakpointsDefinedInPx ? result : emToPx(result)
}

/**
 * @param {string} dynamicSrc
 * @param {number} imageWidth
 * @return {string} Image url having the given width
 * @example
 * // returns https://example.com/image_720.jpg
 * getSrc('https://example.com/image[_{width}].jpg', 720)
 */
export function getSrc(dynamicSrc, imageWidth) {
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
function getSrcWithoutOptionalParams(dynamicSrc) {
    const optionalParams = /\[[^\]]+\]/g
    return dynamicSrc.replace(optionalParams, '')
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
 * @param {string[]|number[]} widths
 * @return {number[]}
 */
function convertToPxNumbers(widths) {
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
                }
                // We're already at the last breakpoint
                return widths[i] !== widths[i - 1] ? vwToPx(vw, currentBp) : undefined
            } else if (pxValue.test(width)) {
                return parseInt(width, 10)
            } else {
                logger.error('Expecting to see values with vw or px unit only', {
                    namespace: 'utils.convertToPxNumbers'
                })
                return 0
            }
        })
        .filter((width) => width !== undefined)
}

/**
 * Transforms an array of preload link objects by converting the raw `media`
 * property of each entry (with `min` and/or `max` values) into actual media
 * queries using `(min-width)` and/or `(max-width)`.
 * @param {{srcSet: string, sizes: string, media: {min?: string, max?: string}}[]} links
 * @return {{srcSet: string, sizes: string, media: string}[]}
 */
function convertImageLinksMedia(links) {
    return links.map((link) => {
        const {
            media: {min, max}
        } = link
        const acc = []
        if (min) {
            acc.push(`(min-width: ${min})`)
        }
        if (max) {
            acc.push(`(max-width: ${max})`)
        }
        return {...link, media: acc.join(' and ')}
    })
}

/**
 * Determines the data required for the responsive `<source>` and `<link rel="preload">
 * portions/elements.
 * @param {string} src
 * @param {(number[]|string[])} widths
 * @param {Densities} densities
 * @returns {{sources: {srcSet: string, sizes: string, media: string}[], links: {srcSet: string, sizes: string, media: string}[]}}
 */
function getResponsiveSourcesAndLinks(src, widths, densities) {
    const sizesWidths = withUnit(widths)
    const l = sizesWidths.length
    const _sizes = breakpointLabels.map((bp, i) => {
        return i === 0
            ? {
                  media: undefined,
                  mediaLink: obtainImageLinkMedia(i),
                  sizes: sizesWidths[i]
              }
            : {
                  media: `(min-width: ${themeBreakpoints[bp]})`,
                  mediaLink: obtainImageLinkMedia(i),
                  sizes: sizesWidths.at(i >= l ? l - 1 : i)
              }
    })

    const sourcesWidths = convertToPxNumbers(padArray(widths))
    const sourcesLength = sourcesWidths.length
    const _densities = getDensities(densities)
    const {sources, links} = breakpointLabels.reduce(
        (acc, bp, idx) => {
            // Request images using given or default density factors. By default, images are requested with factors 1 and 2.
            const width = sourcesWidths.at(idx >= sourcesLength ? sourcesLength - 1 : idx)
            const densityFactors = _densities.at(idx)
            const {sizes, media, mediaLink} = _sizes.at(idx)
            const lastSource = acc.sources.at(-1)
            const lastLink = acc.links.at(-1)
            const srcSet = Array.from(
                densityFactors.reduce((factors, [factorWidth, factorSize]) => {
                    const effectiveWidth = Math.round(width * factorWidth)
                    const effectiveSize = Math.round(width * factorSize)
                    factors.add(`${getSrc(src, effectiveSize)} ${effectiveWidth}w`)
                    return factors
                }, new Set())
            ).join(', ')

            if (
                idx < sourcesLength &&
                (lastSource?.sizes !== sizes || srcSet !== lastSource?.srcSet)
            ) {
                // Only store new `<source>` if we haven't already stored those values
                acc.sources.push({srcSet, sizes, media})
            }

            if (lastLink?.sizes !== sizes || srcSet !== lastLink?.srcSet) {
                // Only store new `<link>` if we haven't already stored those values
                acc.links.push({srcSet, sizes, media: mediaLink})
            } else {
                // If we have already stored those values, update the `max` portion of the related `<link>` data
                lastLink.media.max = mediaLink.max
            }
            return acc
        },
        {sources: [], links: []}
    )
    return {sources: sources.reverse(), links: convertImageLinksMedia(links)}
}

/**
 * Resolve the attributes required to create a DIS-optimized `<picture>` component.
 * @param {Object} props
 * @param {string} props.src - Dynamic src having an optional param that can vary with widths. For example: `image[_{width}].jpg` or `image.jpg[?sw={width}&q=60]`
 * @param {(number[] |string[] |Object)} [props.widths] - Image widths relative to the breakpoints, whose units can either be px or vw or unit-less. They will be mapped to the corresponding `sizes` and `srcSet`.
 * @param {Densities} [props.densities] - Image density factors to apply relative to the breakpoints. Will be mapped to the corresponding `srcSet`.
 * @param {Object} [props.breakpoints] - The current theme's breakpoints. If not given, Chakra's default breakpoints will be used.
 * @return {Object} src, sizes, srcSet, media props for your image component
 * @see {@link DynamicImage}
 * @see {@link mapDensities} for more information about `densities`
 */
export function getResponsivePictureAttributes({
    src,
    widths,
    densities,
    breakpoints = defaultBreakpoints
}) {
    if (!widths) {
        return {
            sources: [],
            links: [],
            src: getSrcWithoutOptionalParams(src)
        }
    }

    if (breakpoints !== themeBreakpoints) {
        themeBreakpoints = breakpoints
        breakpointLabels = getBreakpointLabels(themeBreakpoints)
        !densitiesCache.has(themeBreakpoints) && densitiesCache.set(themeBreakpoints, new WeakMap())
        effectiveDefaultDensities = getEffectiveDensities(themeBreakpoints, defaultDensityFactors)
    }

    const _widths = isObject(widths) ? mapWidthsToSizes(widths) : widths.slice(0)
    const {sources, links} = getResponsiveSourcesAndLinks(src, _widths, densities)
    return {
        sources,
        links,
        src: getSrcWithoutOptionalParams(src)
    }
}
