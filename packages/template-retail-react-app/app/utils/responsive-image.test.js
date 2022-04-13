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

const buildSrcSet = (pxWidths) => {
    const uniqueArray = [...new Set(pxWidths)]
    const widths = uniqueArray.sort()

    return widths
        .map((width) => {
            return `${urlWithWidth(width)} ${width}w, ${urlWithWidth(width * 2)} ${width * 2}w`
        })
        .join(', ')
}
const urlWithWidth = (width) => getSrc(disImageURL.withOptionalParams, width)

test('vw widths', () => {
    let props = getResponsiveImageAttributes({
        src: disImageURL.withOptionalParams,
        widths: ['100vw', '100vw', '50vw']
    })

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

    // This time as _object_
    props = getResponsiveImageAttributes({
        src: disImageURL.withOptionalParams,
        widths: {
            base: '100vw',
            sm: '100vw',
            md: '50vw'
        }
    })
    expect(props).toStrictEqual({
        src: disImageURL.withoutOptionalParams,
        sizes: '(min-width: 48em) 50vw, (min-width: 30em) 100vw, 100vw',
        srcSet: buildSrcSet([480, 768, 496, 640, 768])
    })

    // Edge case: testing changing width at the very last breakpoint (2xl)
    props = getResponsiveImageAttributes({
        src: disImageURL.withOptionalParams,
        widths: {
            base: '100vw',
            '2xl': '50vw'
        }
    })
    // 100vw of sm => 30em => 30 * 16 = 480px
    // 100vw of md => 48em => 768px
    // 100vw of lg => 62em => 992px
    // 100vw of xl => 80em => 1280px
    // 100vw of 2xl => 96em => 1536px
    // 50vw of 2xl => 48em => 768px
    expect(props).toStrictEqual({
        src: disImageURL.withoutOptionalParams,
        sizes:
            '(min-width: 96em) 50vw, (min-width: 80em) 100vw, (min-width: 62em) 100vw, (min-width: 48em) 100vw, (min-width: 30em) 100vw, 100vw',
        srcSet: buildSrcSet([480, 768, 992, 1280, 1536, 768])
    })
})

test('px values', () => {
    // widths in array format
    let props = getResponsiveImageAttributes({
        src: disImageURL.withOptionalParams,
        widths: [100, 500, 1000]
    })
    expect(props).toStrictEqual({
        src: disImageURL.withoutOptionalParams,
        sizes: '(min-width: 48em) 1000px, (min-width: 30em) 500px, 100px',
        srcSet: buildSrcSet([100, 500, 1000])
    })

    // widths in object format
    props = getResponsiveImageAttributes({
        src: disImageURL.withOptionalParams,
        widths: {
            base: 100,
            sm: 500,
            md: 1000
        }
    })
    expect(props).toStrictEqual({
        src: disImageURL.withoutOptionalParams,
        sizes: '(min-width: 48em) 1000px, (min-width: 30em) 500px, 100px',
        srcSet: buildSrcSet([100, 500, 1000])
    })
})

test('mixture of px and vw values', () => {
    let props = getResponsiveImageAttributes({
        src: disImageURL.withOptionalParams,
        widths: ['100vw', '720px', 500]
    })
    // 100vw of sm => 30em => 30 * 16 = 480px

    expect(props).toStrictEqual({
        src: disImageURL.withoutOptionalParams,
        sizes: '(min-width: 48em) 500px, (min-width: 30em) 720px, 100vw',
        srcSet: buildSrcSet([480, 500, 720])
    })
})

test('only src', () => {
    let props = getResponsiveImageAttributes({
        src: disImageURL.withoutOptionalParams
    })
    expect(props).toStrictEqual({
        src: disImageURL.withoutOptionalParams
    })

    // This time _with_ the optional params
    props = getResponsiveImageAttributes({
        src: disImageURL.withOptionalParams
    })
    expect(props).toStrictEqual({
        src: disImageURL.withoutOptionalParams
    })
})

test('passing in theme breakpoints', () => {
    const props = getResponsiveImageAttributes({
        src: disImageURL.withOptionalParams,
        widths: ['100vw', 360],
        breakpoints: {
            base: '0px',
            sm: '320px',
            md: '768px',
            lg: '960px',
            xl: '1200px',
            '2xl': '1536px'
        }
    })
    expect(props).toStrictEqual({
        src: disImageURL.withoutOptionalParams,
        sizes: '(min-width: 320px) 360px, 100vw',
        srcSet: buildSrcSet([320, 360])
    })
})
