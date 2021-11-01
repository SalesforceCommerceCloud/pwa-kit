/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'

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
