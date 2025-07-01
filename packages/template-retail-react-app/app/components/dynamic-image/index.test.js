/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable jest/no-conditional-expect */
import React from 'react'
import {Helmet} from 'react-helmet'
import DynamicImage from '@salesforce/retail-react-app/app/components/dynamic-image/index'
import {Img} from '@salesforce/retail-react-app/app/components/shared/ui'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {isServer} from '@salesforce/retail-react-app/app/components/image/utils'

jest.mock('@salesforce/retail-react-app/app/components/image/utils', () => ({
    ...jest.requireActual('@salesforce/retail-react-app/app/components/image/utils'),
    isServer: jest.fn().mockReturnValue(true)
}))

const src =
    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg'
const imageProps = {
    alt: 'Ruffle Front V-Neck Cardigan, large',
    title: 'Ruffle Front V-Neck Cardigan'
}

describe('Dynamic Image Component', () => {
    test('renders an image without decoding strategy and fetch priority', () => {
        const {getAllByTitle} = renderWithProviders(
            <DynamicImage src={src} imageProps={imageProps} />
        )
        const elements = getAllByTitle(imageProps.title)
        expect(elements).toHaveLength(1)
        expect(elements[0]).not.toHaveAttribute('decoding')
        expect(elements[0]).not.toHaveAttribute('fetchpriority')
    })

    describe('loading="lazy"', () => {
        test('renders an image using the default "async" decoding strategy', () => {
            const {getAllByTitle} = renderWithProviders(
                <DynamicImage
                    src={src}
                    imageProps={{
                        ...imageProps,
                        loading: 'lazy'
                    }}
                />
            )
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('decoding', 'async')
        })

        test.each(['sync', 'async', 'auto'])(
            'renders an image using an explicit "%s" decoding strategy',
            (decoding) => {
                const {getAllByTitle} = renderWithProviders(
                    <DynamicImage
                        src={src}
                        imageProps={{
                            ...imageProps,
                            loading: 'lazy',
                            decoding
                        }}
                    />
                )
                const elements = getAllByTitle(imageProps.title)
                expect(elements).toHaveLength(1)
                expect(elements[0]).toHaveAttribute('decoding', decoding)
            }
        )

        test('renders an image replacing an invalid decoding strategy with the default "async" value', () => {
            const {getAllByTitle} = renderWithProviders(
                <DynamicImage
                    src={src}
                    imageProps={{
                        ...imageProps,
                        loading: 'lazy',
                        decoding: 'invalid'
                    }}
                />
            )
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('decoding', 'async')
        })

        test('renders an explicitly given image component without attribute modifications', () => {
            const {getAllByTitle} = renderWithProviders(
                <DynamicImage
                    src={src}
                    as={Img}
                    imageProps={{
                        ...imageProps,
                        loading: 'lazy'
                    }}
                />
            )
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).not.toHaveAttribute('decoding')
        })
    })

    describe('loading="eager"', () => {
        test('renders an image using the default "high" fetch priority', () => {
            const {getAllByTitle} = renderWithProviders(
                <DynamicImage
                    src={src}
                    imageProps={{
                        ...imageProps,
                        loading: 'eager'
                    }}
                    widths={['50vw', '50vw', '20vw', '20vw', '25vw']}
                />
            )
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('fetchpriority', 'high')

            const helmet = Helmet.peek()
            expect(helmet.linkTags).toHaveLength(1)
            expect(helmet.linkTags[0]).toStrictEqual({
                as: 'image',
                href: src,
                rel: 'preload',
                imageSizes:
                    '(min-width: 80em) 25vw, (min-width: 62em) 20vw, (min-width: 48em) 20vw, (min-width: 30em) 50vw, 50vw',
                imageSrcSet:
                    'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg 198w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg 396w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg 240w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg 480w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg 256w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg 512w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg 384w, https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg 768w'
            })
        })

        test.each(['high', 'low', 'auto'])(
            'renders an image using an explicit "%s" fetch priority',
            (fetchPriority) => {
                const {getAllByTitle} = renderWithProviders(
                    <DynamicImage
                        src={src}
                        imageProps={{
                            ...imageProps,
                            loading: 'eager',
                            fetchPriority
                        }}
                    />
                )
                const elements = getAllByTitle(imageProps.title)
                expect(elements).toHaveLength(1)
                expect(elements[0]).toHaveAttribute('fetchpriority', fetchPriority)

                const helmet = Helmet.peek()
                if (fetchPriority === 'high') {
                    expect(helmet.linkTags).toHaveLength(1)
                    expect(helmet.linkTags[0]).toStrictEqual({
                        as: 'image',
                        href: src,
                        rel: 'preload'
                    })
                } else {
                    expect(helmet.linkTags).toStrictEqual([])
                }
            }
        )

        test('renders an image replacing an invalid fetch priority with the default "auto" value', () => {
            const {getAllByTitle} = renderWithProviders(
                <DynamicImage
                    src={src}
                    imageProps={{
                        ...imageProps,
                        loading: 'eager',
                        fetchPriority: 'invalid'
                    }}
                />
            )
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('fetchpriority', 'auto')
            expect(Helmet.peek().linkTags).toStrictEqual([])
        })

        test('renders an explicitly given image component without modifications', () => {
            const {getAllByTitle} = renderWithProviders(
                <DynamicImage
                    src={src}
                    as={Img}
                    imageProps={{
                        ...imageProps,
                        loading: 'eager'
                    }}
                />
            )
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).not.toHaveAttribute('fetchpriority')
            expect(Helmet.peek().linkTags).toStrictEqual([])
        })

        test('renders an image on the client', () => {
            isServer.mockReturnValue(false)
            const {getAllByTitle} = renderWithProviders(
                <DynamicImage
                    src={src}
                    imageProps={{
                        ...imageProps,
                        loading: 'eager'
                    }}
                />
            )
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('fetchpriority', 'high')
            expect(Helmet.peek().linkTags).toStrictEqual([])
        })
    })
})
