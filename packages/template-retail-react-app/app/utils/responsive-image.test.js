/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    getResponsivePictureAttributes,
    getSrc
} from '@salesforce/retail-react-app/app/utils/responsive-image'

const disImageURL = {
    withOptionalParams:
        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1e4fcb17/images/large/PG.10212867.JJ3XYXX.PZ.jpg[?sw={width}&q=60]',
    withoutOptionalParams:
        'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw1e4fcb17/images/large/PG.10212867.JJ3XYXX.PZ.jpg'
}

const urlWithWidth = (width) => getSrc(disImageURL.withOptionalParams, width)

describe('getResponsivePictureAttributes()', () => {
    test('vw widths', () => {
        let props = getResponsivePictureAttributes({
            src: disImageURL.withOptionalParams,
            widths: ['50vw', '50vw', '20vw', '20vw', '25vw']
        })

        // Breakpoints (1em = 16px)
        // sm: "30em",
        // md: "48em",
        // lg: "62em",
        // xl: "80em",
        // "2xl": "96em",

        // 50vw of sm => 15em => 240px
        // 50vw of md => 24em => 384px
        // 20vw of lg => 12.4em => 198px
        // 20vw of xl => 16em => 256px
        // 25vw of 2xl => 24em => 384px

        expect(props).toStrictEqual({
            src: disImageURL.withoutOptionalParams,
            sources: [
                {
                    media: '(min-width: 80em)',
                    sizes: '25vw',
                    srcSet: [384, 768].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: '(min-width: 62em)',
                    sizes: '20vw',
                    srcSet: [256, 512].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: '(min-width: 48em)',
                    sizes: '20vw',
                    srcSet: [198, 396].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: '(min-width: 30em)',
                    sizes: '50vw',
                    srcSet: [384, 768].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: undefined,
                    sizes: '50vw',
                    srcSet: [240, 480].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                }
            ],
            links: [
                {
                    media: '(max-width: 29.99em)',
                    sizes: '50vw',
                    srcSet: [240, 480].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: '(min-width: 30em) and (max-width: 47.99em)',
                    sizes: '50vw',
                    srcSet: [384, 768].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: '(min-width: 48em) and (max-width: 61.99em)',
                    sizes: '20vw',
                    srcSet: [198, 396].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: '(min-width: 62em) and (max-width: 79.99em)',
                    sizes: '20vw',
                    srcSet: [256, 512].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: '(min-width: 80em)',
                    sizes: '25vw',
                    srcSet: [384, 768].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                }
            ]
        })

        // This time as _object_
        props = getResponsivePictureAttributes({
            src: disImageURL.withOptionalParams,
            widths: {
                base: '100vw',
                sm: '100vw',
                md: '50vw'
            }
        })
        expect(props).toStrictEqual({
            src: disImageURL.withoutOptionalParams,
            sources: [
                {
                    media: '(min-width: 80em)',
                    sizes: '50vw',
                    srcSet: [768, 1536]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 62em)',
                    sizes: '50vw',
                    srcSet: [640, 1280]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 48em)',
                    sizes: '50vw',
                    srcSet: [496, 992].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: '(min-width: 30em)',
                    sizes: '100vw',
                    srcSet: [768, 1536]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: undefined,
                    sizes: '100vw',
                    srcSet: [480, 960].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                }
            ],
            links: [
                {
                    media: '(max-width: 29.99em)',
                    sizes: '100vw',
                    srcSet: [480, 960].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: '(min-width: 30em) and (max-width: 47.99em)',
                    sizes: '100vw',
                    srcSet: [768, 1536]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 48em) and (max-width: 61.99em)',
                    sizes: '50vw',
                    srcSet: [496, 992].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: '(min-width: 62em) and (max-width: 79.99em)',
                    sizes: '50vw',
                    srcSet: [640, 1280]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 80em)',
                    sizes: '50vw',
                    srcSet: [768, 1536]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                }
            ]
        })

        // Edge case: testing changing width at the very last breakpoint (2xl)
        props = getResponsivePictureAttributes({
            src: disImageURL.withOptionalParams,
            widths: {
                base: '100vw',
                '2xl': '50vw'
            }
        })

        // 100vw of sm => 30em => 480px
        // 100vw of md => 48em => 768px
        // 100vw of lg => 62em => 992px
        // 100vw of xl => 80em => 1280px
        // 100vw of 2xl => 96em => 1536px
        // 50vw of 2xl => 48em => 768px
        expect(props).toStrictEqual({
            src: disImageURL.withoutOptionalParams,
            sources: [
                {
                    media: '(min-width: 96em)',
                    sizes: '50vw',
                    srcSet: [768, 1536]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 80em)',
                    sizes: '100vw',
                    srcSet: [1536, 3072]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 62em)',
                    sizes: '100vw',
                    srcSet: [1280, 2560]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 48em)',
                    sizes: '100vw',
                    srcSet: [992, 1984]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 30em)',
                    sizes: '100vw',
                    srcSet: [768, 1536]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: undefined,
                    sizes: '100vw',
                    srcSet: [480, 960].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                }
            ],
            links: [
                {
                    media: '(max-width: 29.99em)',
                    sizes: '100vw',
                    srcSet: [480, 960].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: '(min-width: 30em) and (max-width: 47.99em)',
                    sizes: '100vw',
                    srcSet: [768, 1536]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 48em) and (max-width: 61.99em)',
                    sizes: '100vw',
                    srcSet: [992, 1984]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 62em) and (max-width: 79.99em)',
                    sizes: '100vw',
                    srcSet: [1280, 2560]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 80em) and (max-width: 95.99em)',
                    sizes: '100vw',
                    srcSet: [1536, 3072]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 96em)',
                    sizes: '50vw',
                    srcSet: [768, 1536]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                }
            ]
        })
    })

    test('px values', () => {
        // widths in array format
        let props = getResponsivePictureAttributes({
            src: disImageURL.withOptionalParams,
            widths: [100, 500, 1000]
        })
        expect(props).toStrictEqual({
            src: disImageURL.withoutOptionalParams,
            sources: [
                {
                    media: '(min-width: 48em)',
                    sizes: '1000px',
                    srcSet: [1000, 2000]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 30em)',
                    sizes: '500px',
                    srcSet: [500, 1000]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: undefined,
                    sizes: '100px',
                    srcSet: [100, 200].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                }
            ],
            links: [
                {
                    media: '(max-width: 29.99em)',
                    sizes: '100px',
                    srcSet: [100, 200].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: '(min-width: 30em) and (max-width: 47.99em)',
                    sizes: '500px',
                    srcSet: [500, 1000]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 48em)',
                    sizes: '1000px',
                    srcSet: [1000, 2000]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                }
            ]
        })

        props = getResponsivePictureAttributes({
            src: disImageURL.withOptionalParams,
            widths: {
                base: 100,
                sm: 500,
                md: 1000,
                '2xl': 500
            }
        })
        expect(props).toStrictEqual({
            src: disImageURL.withoutOptionalParams,
            sources: [
                {
                    media: '(min-width: 96em)',
                    sizes: '500px',
                    srcSet: [500, 1000]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 48em)',
                    sizes: '1000px',
                    srcSet: [1000, 2000]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 30em)',
                    sizes: '500px',
                    srcSet: [500, 1000]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: undefined,
                    sizes: '100px',
                    srcSet: [100, 200].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                }
            ],
            links: [
                {
                    media: '(max-width: 29.99em)',
                    sizes: '100px',
                    srcSet: [100, 200].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: '(min-width: 30em) and (max-width: 47.99em)',
                    sizes: '500px',
                    srcSet: [500, 1000]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 48em) and (max-width: 95.99em)',
                    sizes: '1000px',
                    srcSet: [1000, 2000]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 96em)',
                    sizes: '500px',
                    srcSet: [500, 1000]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                }
            ]
        })
    })

    test('mixture of px and vw values', () => {
        let props = getResponsivePictureAttributes({
            src: disImageURL.withOptionalParams,
            widths: ['100vw', '720px', 500]
        })

        expect(props).toStrictEqual({
            src: disImageURL.withoutOptionalParams,
            sources: [
                {
                    media: '(min-width: 48em)',
                    sizes: '500px',
                    srcSet: [500, 1000]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 30em)',
                    sizes: '720px',
                    srcSet: [720, 1440]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: undefined,
                    sizes: '100vw',
                    srcSet: [480, 960].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                }
            ],
            links: [
                {
                    media: '(max-width: 29.99em)',
                    sizes: '100vw',
                    srcSet: [480, 960].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: '(min-width: 30em) and (max-width: 47.99em)',
                    sizes: '720px',
                    srcSet: [720, 1440]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                },
                {
                    media: '(min-width: 48em)',
                    sizes: '500px',
                    srcSet: [500, 1000]
                        .map((width) => `${urlWithWidth(width)} ${width}w`)
                        .join(', ')
                }
            ]
        })
    })

    test('only src', () => {
        let props = getResponsivePictureAttributes({
            src: disImageURL.withoutOptionalParams
        })
        expect(props).toStrictEqual({
            sources: [],
            links: [],
            src: disImageURL.withoutOptionalParams
        })

        // This time _with_ the optional params
        props = getResponsivePictureAttributes({
            src: disImageURL.withOptionalParams
        })
        expect(props).toStrictEqual({
            sources: [],
            links: [],
            src: disImageURL.withoutOptionalParams
        })
    })

    test('passing in theme breakpoints', () => {
        const props = getResponsivePictureAttributes({
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
            sources: [
                {
                    media: '(min-width: 320px)',
                    sizes: '360px',
                    srcSet: [360, 720].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: undefined,
                    sizes: '100vw',
                    srcSet: [320, 640].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                }
            ],
            links: [
                {
                    media: '(max-width: 319px)',
                    sizes: '100vw',
                    srcSet: [320, 640].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                },
                {
                    media: '(min-width: 320px)',
                    sizes: '360px',
                    srcSet: [360, 720].map((width) => `${urlWithWidth(width)} ${width}w`).join(', ')
                }
            ]
        })
    })
})
