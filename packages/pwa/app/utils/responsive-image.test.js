/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getResponsiveImageAttributes, getSrc} from './responsive-image'

const disImageURL = {
    withOptionalParams:
        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1e4fcb17/images/large/PG.10212867.JJ3XYXX.PZ.jpg[?sw={width}&q=60]',
    withoutOptionalParams:
        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1e4fcb17/images/large/PG.10212867.JJ3XYXX.PZ.jpg'
}

const staticImageURL = {
    withOptionalParams: 'https://example.com/image[_{width}].jpg',
    withoutOptionalParams: 'https://example.com/image.jpg'
}

test('vwSizes', () => {
    let props = getResponsiveImageAttributes({
        src: disImageURL.withOptionalParams,
        vwSizes: [100, 100, 50]
    })

    const urlWithWidth = (width) => getSrc(disImageURL.withOptionalParams, width)
    const buildSrcSet = (pxWidths) => {
        return pxWidths
            .map((width) => {
                return `${urlWithWidth(width)} ${width}w, ${urlWithWidth(width * 2)} ${width * 2}w`
            })
            .join(', ')
    }

    // Breakpoints
    // sm: "30em",
    // md: "48em",
    // lg: "62em",
    // xl: "80em",
    // "2xl": "96em",

    // 100vw of sm => 30em => 30 * 16 = 480px
    // 100vw of md => 48em => 768px
    // 50vw of lg => 31em => 496px
    // 50vw of xl => 40em => 640
    // 50vw of 2xl => 48em => 768px

    expect(props).toStrictEqual({
        src: disImageURL.withoutOptionalParams,
        sizes: '(min-width: 48em) 50vw, (min-width: 30em) 100vw, 100vw',
        srcSet: buildSrcSet([480, 768, 496, 640, 768])
    })

    // This time with vwSizes as _object_
    props = getResponsiveImageAttributes({
        src: disImageURL.withOptionalParams,
        vwSizes: {
            base: 100,
            sm: 100,
            md: 50
        }
    })
    expect(props).toStrictEqual({
        src: disImageURL.withoutOptionalParams,
        sizes:
            '(min-width: 96em) 50vw, (min-width: 80em) 50vw, (min-width: 62em) 50vw, (min-width: 48em) 50vw, (min-width: 30em) 100vw, 100vw',
        srcSet: buildSrcSet([480, 768, 496, 640, 768])
    })
})

test('manually specifying sizes and srcset', () => {
    const srcSet = [300, 720, 1000, 1500]

    let props = getResponsiveImageAttributes({
        src: staticImageURL.withOptionalParams,
        sizes: ['100vw', '100vw', '50vw', '350px'],
        srcSet
    })

    // Breakpoints
    // sm: "30em",
    // md: "48em",
    // lg: "62em",
    // xl: "80em",
    // "2xl": "96em",

    const urlWithWidth = (width) => getSrc(staticImageURL.withOptionalParams, width)

    expect(props).toStrictEqual({
        src: staticImageURL.withoutOptionalParams,
        sizes: '(min-width: 62em) 350px, (min-width: 48em) 50vw, (min-width: 30em) 100vw, 100vw',
        srcSet: srcSet.map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
    })

    // This time sizes is an _object_
    props = getResponsiveImageAttributes({
        src: staticImageURL.withOptionalParams,
        sizes: {
            base: '100vw',
            sm: '100vw',
            md: '50vw',
            lg: '350px'
        },
        srcSet
    })
    expect(props).toStrictEqual({
        src: staticImageURL.withoutOptionalParams,
        sizes: '(min-width: 62em) 350px, (min-width: 48em) 50vw, (min-width: 30em) 100vw, 100vw',
        srcSet: srcSet.map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
    })
})

test('literal values', () => {
    const props = getResponsiveImageAttributes({
        src: staticImageURL.withoutOptionalParams,
        sizes: '(min-width: 1200px) 800px, (min-width: 720px) 50vw, 100vw',
        srcSet: 'https://example.com/image_800.jpg 800w, https://example.com/image_1600.jpg 1600w'
    })

    // Expecting the output to be the same as input
    expect(props).toStrictEqual({
        src: staticImageURL.withoutOptionalParams,
        sizes: '(min-width: 1200px) 800px, (min-width: 720px) 50vw, 100vw',
        srcSet: 'https://example.com/image_800.jpg 800w, https://example.com/image_1600.jpg 1600w'
    })
})

test('only src', () => {
    let props = getResponsiveImageAttributes({
        src: staticImageURL.withoutOptionalParams
    })
    expect(props).toStrictEqual({
        src: staticImageURL.withoutOptionalParams
    })

    // This time _with_ the optional params
    props = getResponsiveImageAttributes({
        src: staticImageURL.withOptionalParams
    })
    expect(props).toStrictEqual({
        src: staticImageURL.withoutOptionalParams
    })
})
