/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import React from 'react'
import {Image} from '@chakra-ui/react'

/**
 * @param {Object} props
 * @param {string} props.src - The image's url
 * @param {Object} [props.sizes] - Defines how the image responds across Chakra breakpoints
 * @param {number[]} [props.widths] - Will be used to generate the image's srcset
 * @param {Object} [props.transformations] - How to transform the image's url {@link https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/content/b2c_commerce/topics/image_management/b2c_creating_image_transformation_urls.html}
 * @return {Object} - Props for an image component
 *
 * @example
 * <Img
 *     {...getImageProps({
 *         src,
 *         sizes: {base: 'calc(100vw / 2)', md: '500px'},
 *         widths: [500, 1000, 1500],
 *         transformations: {q: 60}
 *     })}
 * />
 */
export const getImageProps = ({src, sizes, widths, transformations, ...otherProps}) => {
    const url = transformImageUrl(src, transformations)

    const srcSet = (widths || [])
        .map((width) => {
            url.searchParams.set('sw', width)
            return `${url} ${width}w`
        })
        .join(', ')

    return {
        src,
        ...(sizes ? {sizes: buildSizes(sizes)} : {}),
        ...(srcSet ? {srcSet} : {}),
        ...otherProps
    }
}

/**
 * @param {string} src - The image's url
 * @param {Object} [transformations] - How to transform the image's url
 * @return {URL} url object
 */
export const transformImageUrl = (src, transformations = {}) => {
    const fallbackOrigin = getAppOrigin()
    const url = new URL(src, fallbackOrigin)

    for (const key in DEFAULT_TRANSFORMATIONS) {
        url.searchParams.set(key, DEFAULT_TRANSFORMATIONS[key])
    }
    for (const key in transformations) {
        url.searchParams.set(key, transformations[key])
    }

    return url
}

const DEFAULT_TRANSFORMATIONS = {
    q: 60
}

const buildSizes = (sizes = {}) => {
    const s = []

    // TODO: can we get these programatically?
    // Aligned with default Chakra breakpoints:
    // https://chakra-ui.com/docs/features/responsive-styles
    sizes['2xl'] && s.push(`(min-width: 96em) ${sizes['2xl']}`)
    sizes.xl && s.push(`(min-width: 80em) ${sizes.xl}`)
    sizes.lg && s.push(`(min-width: 62em) ${sizes.lg}`)
    sizes.md && s.push(`(min-width: 48em) ${sizes.md}`)
    sizes.sm && s.push(`(min-width: 30em) ${sizes.sm}`)
    sizes.base && s.push(sizes.base)

    return s.join(', ')
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
