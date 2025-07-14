/*
 * Copyright (c) 2025, Salesforce, Inc.
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

const vwValue = /^\d+vw$/
const pxValue = /^\d+px$/
const emValue = /^\d+em$/

const {breakpoints: defaultBreakpoints} = theme
let themeBreakpoints = defaultBreakpoints
let breakpointLabels = getBreakpointLabels(themeBreakpoints)

/**
 * Helper to create very specific `media` attributes for responsive preload purposes.
 * @param {number} breakpointIndex
 * @return {({min?: string, max?: string} | undefined)}
 * @see {@link https://web.dev/articles/preload-responsive-images#picture}
 */
const obtainImageLinkMedia = (breakpointIndex) => {
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
        }
        return mostRecent
    })
}

/**
 * @param {number} em
 * @param {number} [browserDefaultFontSize]
 */
const emToPx = (em, browserDefaultFontSize = 16) => Math.round(em * browserDefaultFontSize)

/**
 * @param {number} vw
 * @param {string} breakpoint
 */
const vwToPx = (vw, breakpoint) => {
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
const getSrcWithoutOptionalParams = (dynamicSrc) => dynamicSrc.replace(/\[[^\]]+\]/g, '')

const padArray = (arr) => {
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
const convertToPxNumbers = (widths) =>
    widths
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

/**
 * Transforms an array of preload link objects by converting the raw `media`
 * property of each entry (with `min` and/or `max` values) into actual media
 * queries using `(min-width)` and/or `(max-width)`.
 * @param {{srcSet: string, sizes: string, media: {min?: string, max?: string}}[]} links
 * @return {{srcSet: string, sizes: string, media: string}[]}
 */
const convertImageLinksMedia = (links) =>
    links.map((link) => {
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

/**
 * Determines the data required for the responsive `<source>` and `<link rel="preload">
 * portions/elements.
 * @param {string} src
 * @param {(number[]|string[])} widths
 * @returns {{sources: {srcSet: string, sizes: string, media: string}[], links: {srcSet: string, sizes: string, media: string}[]}}
 */
const getResponsiveSourcesAndLinks = (src, widths) => {
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
    const {sources, links} = breakpointLabels.reduce(
        (acc, bp, idx) => {
            // To support higher-density devices, request all images in 1x and 2x widths
            const width = sourcesWidths.at(idx >= sourcesLength ? sourcesLength - 1 : idx)
            const {sizes, media, mediaLink} = _sizes.at(idx)
            const lastSource = acc.sources.at(-1)
            const lastLink = acc.links.at(-1)
            const srcSet = [1, 2]
                .map((factor) => {
                    const effectiveWidth = Math.round(width * factor)
                    const effectiveSize = Math.round(width * factor)
                    return `${getSrc(src, effectiveSize)} ${effectiveWidth}w`
                })
                .join(', ')

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
 * @param {Object} [props.breakpoints] - The current theme's breakpoints. If not given, Chakra's default breakpoints will be used.
 * @return {Object} src, sizes, srcSet, media props for your image component
 * @see {@link DynamicImage}
 */
export const getResponsivePictureAttributes = ({src, widths, breakpoints = defaultBreakpoints}) => {
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
    }

    const _widths = isObject(widths) ? widthsAsArray(widths) : widths.slice(0)
    const {sources, links} = getResponsiveSourcesAndLinks(src, _widths)
    return {
        sources,
        links,
        src: getSrcWithoutOptionalParams(src)
    }
}
