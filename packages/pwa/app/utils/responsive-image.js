/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const getImageProps = ({src, sizes, widths, transformations, ...otherProps}) => {
    const url = transformImageUrl(src, transformations)

    const srcset = widths
        .map((width) => {
            url.searchParams.set('sw', width)
            return `${url} ${width}w`
        })
        .join(', ')

    return {
        // TODO: src should be transformed? and have average width?
        src,
        sizes: buildSizes(sizes),
        srcset,
        ...otherProps
    }
}

export const transformImageUrl = (src, transformations = {}) => {
    const fallbackOrigin = 'https://edge.disstg.commercecloud.salesforce.com/'
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

/**
 * @private
 */
const buildSizes = (sizes) => {
    const s = []

    sizes['2xl'] && s.push(`(min-width: 96em) ${sizes['2xl']}`)
    sizes.xl && s.push(`(min-width: 80em) ${sizes.xl}`)
    sizes.lg && s.push(`(min-width: 62em) ${sizes.lg}`)
    sizes.md && s.push(`(min-width: 48em) ${sizes.md}`)
    sizes.sm && s.push(`(min-width: 30em) ${sizes.sm}`)
    s.push(sizes.base)

    return s.join(', ')
}
