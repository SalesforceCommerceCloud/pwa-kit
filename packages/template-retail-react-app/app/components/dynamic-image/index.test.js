/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable jest/no-conditional-expect */
import React from 'react'
import {Helmet} from 'react-helmet'
import DynamicImage from '@salesforce/retail-react-app/app/components/dynamic-image'
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
        const {getByTestId, getAllByTitle} = renderWithProviders(
            <DynamicImage data-testid={'dynamic-image'} src={src} imageProps={imageProps} />
        )

        const wrapper = getByTestId('dynamic-image')
        const elements = getAllByTitle(imageProps.title)
        expect(elements).toHaveLength(1)
        expect(elements[0]).not.toHaveAttribute('decoding')
        expect(elements[0]).not.toHaveAttribute('fetchpriority')
        expect(wrapper.firstElementChild).toBe(elements[0])
    })

    describe('loading="lazy"', () => {
        test('renders an image using the default "async" decoding strategy', () => {
            const {getByTestId, getAllByTitle} = renderWithProviders(
                <DynamicImage
                    data-testid={'dynamic-image'}
                    src={src}
                    imageProps={{
                        ...imageProps,
                        loading: 'lazy'
                    }}
                />
            )

            const wrapper = getByTestId('dynamic-image')
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('decoding', 'async')
            expect(wrapper.firstElementChild).toBe(elements[0])
        })

        test.each(['sync', 'async', 'auto'])(
            'renders an image using an explicit "%s" decoding strategy',
            (decoding) => {
                const {getByTestId, getAllByTitle} = renderWithProviders(
                    <DynamicImage
                        data-testid={'dynamic-image'}
                        src={src}
                        imageProps={{
                            ...imageProps,
                            loading: 'lazy',
                            decoding
                        }}
                    />
                )

                const wrapper = getByTestId('dynamic-image')
                const elements = getAllByTitle(imageProps.title)
                expect(elements).toHaveLength(1)
                expect(elements[0]).toHaveAttribute('decoding', decoding)
                expect(wrapper.firstElementChild).toBe(elements[0])
            }
        )

        test('renders an image replacing an invalid decoding strategy with the default "async" value', () => {
            const {getByTestId, getAllByTitle} = renderWithProviders(
                <DynamicImage
                    data-testid={'dynamic-image'}
                    src={src}
                    imageProps={{
                        ...imageProps,
                        loading: 'lazy',
                        decoding: 'invalid'
                    }}
                />
            )
            const wrapper = getByTestId('dynamic-image')
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('decoding', 'async')
            expect(wrapper.firstElementChild).toBe(elements[0])
        })

        test('renders an explicitly given image component', () => {
            const {getByTestId, getAllByTitle} = renderWithProviders(
                <DynamicImage
                    data-testid={'dynamic-image'}
                    src={src}
                    as={Img}
                    imageProps={{
                        ...imageProps,
                        loading: 'lazy'
                    }}
                />
            )

            const wrapper = getByTestId('dynamic-image')
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('decoding', 'async')
            expect(wrapper.firstElementChild).toBe(elements[0])
        })

        test('renders an image with explicit widths', () => {
            const {getByTestId, getAllByTitle} = renderWithProviders(
                <DynamicImage
                    data-testid={'dynamic-image'}
                    src={src}
                    imageProps={{
                        ...imageProps,
                        loading: 'lazy'
                    }}
                    widths={['50vw', '50vw', '20vw', '20vw', '25vw']}
                />
            )

            const wrapper = getByTestId('dynamic-image')
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('src', src)
            expect(elements[0]).toHaveAttribute('loading', 'lazy')
            expect(elements[0]).toHaveAttribute('decoding', 'async')
            expect(elements[0]).not.toHaveAttribute('sizes')
            expect(elements[0]).not.toHaveAttribute('srcset')

            expect(wrapper.firstElementChild).not.toBe(elements[0])
            expect(wrapper.firstElementChild.tagName.toLowerCase()).toBe('picture')

            const sourceElements = Array.from(wrapper.querySelectorAll('source'))
            expect(sourceElements).toHaveLength(5)
            expect(sourceElements[0]).toHaveAttribute('media', '(min-width: 80em)')
            expect(sourceElements[0]).toHaveAttribute('sizes', '25vw')
            expect(sourceElements[0]).toHaveAttribute(
                'srcset',
                [384, 768].map((width) => `${src} ${width}w`).join(', ')
            )
            expect(sourceElements[1]).toHaveAttribute('media', '(min-width: 62em)')
            expect(sourceElements[1]).toHaveAttribute('sizes', '20vw')
            expect(sourceElements[1]).toHaveAttribute(
                'srcset',
                [256, 512].map((width) => `${src} ${width}w`).join(', ')
            )
            expect(sourceElements[2]).toHaveAttribute('media', '(min-width: 48em)')
            expect(sourceElements[2]).toHaveAttribute('sizes', '20vw')
            expect(sourceElements[2]).toHaveAttribute(
                'srcset',
                [198, 396].map((width) => `${src} ${width}w`).join(', ')
            )
            expect(sourceElements[3]).toHaveAttribute('media', '(min-width: 30em)')
            expect(sourceElements[3]).toHaveAttribute('sizes', '50vw')
            expect(sourceElements[3]).toHaveAttribute(
                'srcset',
                [384, 768].map((width) => `${src} ${width}w`).join(', ')
            )
            expect(sourceElements[4]).not.toHaveAttribute('media')
            expect(sourceElements[4]).toHaveAttribute('sizes', '50vw')
            expect(sourceElements[4]).toHaveAttribute(
                'srcset',
                [240, 480].map((width) => `${src} ${width}w`).join(', ')
            )

            expect(Helmet.peek()?.linkTags ?? []).toStrictEqual([])
        })
    })

    describe('loading="eager"', () => {
        test('renders an image using the default "high" fetch priority', () => {
            const {getByTestId, getAllByTitle} = renderWithProviders(
                <DynamicImage
                    data-testid={'dynamic-image'}
                    src={src}
                    imageProps={{
                        ...imageProps,
                        loading: 'eager'
                    }}
                    widths={['50vw', '50vw', '20vw', '20vw', '25vw']}
                />
            )

            const wrapper = getByTestId('dynamic-image')
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('src', src)
            expect(elements[0]).toHaveAttribute('loading', 'eager')
            expect(elements[0]).toHaveAttribute('fetchpriority', 'high')
            expect(elements[0]).not.toHaveAttribute('sizes')
            expect(elements[0]).not.toHaveAttribute('srcset')

            expect(wrapper.firstElementChild).not.toBe(elements[0])
            expect(wrapper.firstElementChild.tagName.toLowerCase()).toBe('picture')

            const sourceElements = Array.from(wrapper.querySelectorAll('source'))
            expect(sourceElements).toHaveLength(5)
            expect(sourceElements[0]).toHaveAttribute('media', '(min-width: 80em)')
            expect(sourceElements[0]).toHaveAttribute('sizes', '25vw')
            expect(sourceElements[0]).toHaveAttribute(
                'srcset',
                [384, 768].map((width) => `${src} ${width}w`).join(', ')
            )
            expect(sourceElements[1]).toHaveAttribute('media', '(min-width: 62em)')
            expect(sourceElements[1]).toHaveAttribute('sizes', '20vw')
            expect(sourceElements[1]).toHaveAttribute(
                'srcset',
                [256, 512].map((width) => `${src} ${width}w`).join(', ')
            )
            expect(sourceElements[2]).toHaveAttribute('media', '(min-width: 48em)')
            expect(sourceElements[2]).toHaveAttribute('sizes', '20vw')
            expect(sourceElements[2]).toHaveAttribute(
                'srcset',
                [198, 396].map((width) => `${src} ${width}w`).join(', ')
            )
            expect(sourceElements[3]).toHaveAttribute('media', '(min-width: 30em)')
            expect(sourceElements[3]).toHaveAttribute('sizes', '50vw')
            expect(sourceElements[3]).toHaveAttribute(
                'srcset',
                [384, 768].map((width) => `${src} ${width}w`).join(', ')
            )
            expect(sourceElements[4]).not.toHaveAttribute('media')
            expect(sourceElements[4]).toHaveAttribute('sizes', '50vw')
            expect(sourceElements[4]).toHaveAttribute(
                'srcset',
                [240, 480].map((width) => `${src} ${width}w`).join(', ')
            )

            const helmet = Helmet.peek()
            expect(helmet.linkTags).toHaveLength(5)
            expect(helmet.linkTags).toStrictEqual([
                {
                    rel: 'preload',
                    as: 'image',
                    href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg',
                    fetchPriority: 'high',
                    media: '(max-width: 29.99em)',
                    imageSizes: '50vw',
                    imageSrcSet: [240, 480].map((width) => `${src} ${width}w`).join(', ')
                },
                {
                    rel: 'preload',
                    as: 'image',
                    href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg',
                    fetchPriority: 'high',
                    media: '(min-width: 30em) and (max-width: 47.99em)',
                    imageSizes: '50vw',
                    imageSrcSet: [384, 768].map((width) => `${src} ${width}w`).join(', ')
                },
                {
                    rel: 'preload',
                    as: 'image',
                    href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg',
                    fetchPriority: 'high',
                    media: '(min-width: 48em) and (max-width: 61.99em)',
                    imageSizes: '20vw',
                    imageSrcSet: [198, 396].map((width) => `${src} ${width}w`).join(', ')
                },
                {
                    rel: 'preload',
                    as: 'image',
                    href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg',
                    fetchPriority: 'high',
                    media: '(min-width: 62em) and (max-width: 79.99em)',
                    imageSizes: '20vw',
                    imageSrcSet: [256, 512].map((width) => `${src} ${width}w`).join(', ')
                },
                {
                    rel: 'preload',
                    as: 'image',
                    href: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg',
                    fetchPriority: 'high',
                    media: '(min-width: 80em)',
                    imageSizes: '25vw',
                    imageSrcSet: [384, 768].map((width) => `${src} ${width}w`).join(', ')
                }
            ])
        })

        test.each(['high', 'low', 'auto'])(
            'renders an image using an explicit "%s" fetch priority',
            (fetchPriority) => {
                const {getByTestId, getAllByTitle} = renderWithProviders(
                    <DynamicImage
                        data-testid={'dynamic-image'}
                        src={src}
                        imageProps={{
                            ...imageProps,
                            loading: 'eager',
                            fetchPriority
                        }}
                    />
                )

                const wrapper = getByTestId('dynamic-image')
                const elements = getAllByTitle(imageProps.title)
                expect(elements).toHaveLength(1)
                expect(elements[0]).toHaveAttribute('fetchpriority', fetchPriority)
                expect(wrapper.firstElementChild).toBe(elements[0])

                const helmet = Helmet.peek()
                if (fetchPriority === 'high') {
                    expect(helmet.linkTags).toHaveLength(1)
                    expect(helmet.linkTags[0]).toStrictEqual({
                        as: 'image',
                        href: src,
                        rel: 'preload',
                        fetchPriority: 'high'
                    })
                } else {
                    expect(helmet.linkTags).toStrictEqual([])
                }
            }
        )

        test('renders an image replacing an invalid fetch priority with the default "auto" value', () => {
            const {getByTestId, getAllByTitle} = renderWithProviders(
                <DynamicImage
                    data-testid={'dynamic-image'}
                    src={src}
                    imageProps={{
                        ...imageProps,
                        loading: 'eager',
                        fetchPriority: 'invalid'
                    }}
                />
            )

            const wrapper = getByTestId('dynamic-image')
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('fetchpriority', 'auto')
            expect(wrapper.firstElementChild).toBe(elements[0])
            expect(Helmet.peek()?.linkTags ?? []).toStrictEqual([])
        })

        test('renders an explicitly given image component', () => {
            const {getByTestId, getAllByTitle} = renderWithProviders(
                <DynamicImage
                    data-testid={'dynamic-image'}
                    src={src}
                    as={Img}
                    imageProps={{
                        ...imageProps,
                        loading: 'eager'
                    }}
                />
            )

            const wrapper = getByTestId('dynamic-image')
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('fetchpriority', 'high')
            expect(wrapper.firstElementChild).toBe(elements[0])
            expect(Helmet.peek().linkTags).toStrictEqual([
                {
                    as: 'image',
                    href: src,
                    rel: 'preload',
                    fetchPriority: 'high'
                }
            ])
        })

        test('renders an image on the client', () => {
            isServer.mockReturnValue(false)
            const {getByTestId, getAllByTitle} = renderWithProviders(
                <DynamicImage
                    data-testid={'dynamic-image'}
                    src={src}
                    imageProps={{
                        ...imageProps,
                        loading: 'eager'
                    }}
                />
            )

            const wrapper = getByTestId('dynamic-image')
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('fetchpriority', 'high')
            expect(wrapper.firstElementChild).toBe(elements[0])
            expect(Helmet.peek()?.linkTags ?? []).toStrictEqual([])
        })
    })
})
