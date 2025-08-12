/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable jest/no-conditional-expect */
import {version} from 'react'
import {
    getImageAttributes,
    getImageLinkAttributes
} from '@salesforce/retail-react-app/app/utils/image'

const [majorStr] = version.split('.', 1)
const major = parseInt(majorStr, 10)
const fetchPriorityProp = major > 18 ? 'fetchPriority' : 'fetchpriority'

const imageProps = {
    src: 'file:///foo.jpg',
    alt: 'Ruffle Front V-Neck Cardigan, large',
    title: 'Ruffle Front V-Neck Cardigan'
}

describe('getImageAttributes()', () => {
    test('empty image properties', () => {
        expect(getImageAttributes({})).toStrictEqual({})
    })

    test('image properties without decoding strategy and fetch priority', () => {
        expect(getImageAttributes(imageProps)).toStrictEqual(imageProps)
    })

    describe('loading="lazy"', () => {
        test('image properties without an explicit decoding strategy', () => {
            expect(getImageAttributes({...imageProps, loading: 'lazy'})).toStrictEqual({
                ...imageProps,
                loading: 'lazy',
                decoding: 'async'
            })
        })

        test.each(['async', 'sync', 'auto'])(
            'image properties with an explicit "%s" decoding strategy',
            (decoding) => {
                const effectiveProps = {...imageProps, loading: 'lazy', decoding}
                expect(getImageAttributes(effectiveProps)).toStrictEqual(effectiveProps)
            }
        )

        test('image properties with an invalid decoding strategy', () => {
            expect(
                getImageAttributes({...imageProps, loading: 'lazy', decoding: 'invalid'})
            ).toStrictEqual({
                ...imageProps,
                loading: 'lazy',
                decoding: 'async'
            })
        })
    })

    describe('loading="eager"', () => {
        test('image properties without an explicit fetch priority', () => {
            const result = getImageAttributes({...imageProps, loading: 'eager'})
            expect(result).toStrictEqual({
                ...imageProps,
                loading: 'eager',
                [fetchPriorityProp]: 'high'
            })

            if (major <= 18) {
                expect(result.fetchPriority).toBe('high')
                const desc = Object.getOwnPropertyDescriptor(result, 'fetchPriority')
                expect(desc).toStrictEqual({
                    value: 'high',
                    enumerable: false,
                    configurable: false,
                    writable: false
                })
            }
        })

        test.each(['high', 'low', 'auto'])(
            'image properties with an explicit "%s" fetch priority',
            (fetchPriority) => {
                const result = getImageAttributes({...imageProps, loading: 'eager', fetchPriority})
                expect(result).toStrictEqual({
                    ...imageProps,
                    loading: 'eager',
                    [fetchPriorityProp]: fetchPriority
                })

                if (major <= 18) {
                    expect(result.fetchPriority).toBe(fetchPriority)
                    const desc = Object.getOwnPropertyDescriptor(result, 'fetchPriority')
                    expect(desc).toStrictEqual({
                        value: fetchPriority,
                        enumerable: false,
                        configurable: false,
                        writable: false
                    })
                }
            }
        )

        test('image properties with an invalid fetch priority', () => {
            const result = getImageAttributes({
                ...imageProps,
                loading: 'eager',
                fetchPriority: 'invalid'
            })
            expect(result).toStrictEqual({
                ...imageProps,
                loading: 'eager',
                [fetchPriorityProp]: 'auto'
            })

            if (major <= 18) {
                expect(result.fetchPriority).toBe('auto')
                const desc = Object.getOwnPropertyDescriptor(result, 'fetchPriority')
                expect(desc).toStrictEqual({
                    value: 'auto',
                    enumerable: false,
                    configurable: false,
                    writable: false
                })
            }
        })
    })
})

describe('getImageLinkAttributes()', () => {
    test('empty image properties', () => {
        expect(getImageLinkAttributes({})).toBeUndefined()
    })

    test('image properties without fetch priority and loading strategy', () => {
        expect(getImageLinkAttributes(imageProps)).toBeUndefined()
    })

    test('image properties with fetch priority, without loading strategy, sizes and srcSet', () => {
        expect(getImageLinkAttributes({...imageProps, fetchPriority: 'high'})).toStrictEqual({
            rel: 'preload',
            as: 'image',
            href: imageProps.src,
            fetchPriority: 'high'
        })
    })

    test('image properties with fetch priority, sizes and srcSet, without loading strategy', () => {
        expect(
            getImageLinkAttributes({
                ...imageProps,
                fetchPriority: 'high',
                sizes: '100vw',
                srcSet: `${imageProps.src} 240w`
            })
        ).toStrictEqual({
            rel: 'preload',
            as: 'image',
            href: imageProps.src,
            fetchPriority: 'high',
            imageSizes: '100vw',
            imageSrcSet: `${imageProps.src} 240w`
        })
    })

    test('image properties with fetch priority, type and media, without loading strategy, sizes and srcSet', () => {
        expect(
            getImageLinkAttributes({
                ...imageProps,
                fetchPriority: 'high',
                type: 'image/jpeg',
                media: '(min-width: 80em)'
            })
        ).toStrictEqual({
            rel: 'preload',
            as: 'image',
            href: imageProps.src,
            fetchPriority: 'high',
            type: 'image/jpeg',
            media: '(min-width: 80em)'
        })
    })

    test('image properties with fetch priority, type, media, sizes and srcSet, without loading strategy', () => {
        expect(
            getImageLinkAttributes({
                ...imageProps,
                fetchPriority: 'high',
                type: 'image/jpeg',
                media: '(min-width: 80em)',
                sizes: '100vw',
                srcSet: `${imageProps.src} 240w`
            })
        ).toStrictEqual({
            rel: 'preload',
            as: 'image',
            href: imageProps.src,
            fetchPriority: 'high',
            type: 'image/jpeg',
            media: '(min-width: 80em)',
            imageSizes: '100vw',
            imageSrcSet: `${imageProps.src} 240w`
        })
    })

    describe('loading="eager"', () => {
        test('image properties without fetch priority', () => {
            expect(getImageLinkAttributes({...imageProps, loading: 'eager'})).toBeUndefined()
        })

        test('image properties with fetch priority, without loading strategy, sizes and srcSet', () => {
            expect(
                getImageLinkAttributes({...imageProps, loading: 'eager', fetchPriority: 'high'})
            ).toStrictEqual({
                rel: 'preload',
                as: 'image',
                href: imageProps.src,
                fetchPriority: 'high'
            })
        })

        test('image properties with fetch priority, sizes and srcSet', () => {
            expect(
                getImageLinkAttributes({
                    ...imageProps,
                    loading: 'eager',
                    fetchPriority: 'high',
                    sizes: '100vw',
                    srcSet: `${imageProps.src} 240w`
                })
            ).toStrictEqual({
                rel: 'preload',
                as: 'image',
                href: imageProps.src,
                fetchPriority: 'high',
                imageSizes: '100vw',
                imageSrcSet: `${imageProps.src} 240w`
            })
        })
    })

    describe('loading="lazy"', () => {
        test('image properties without fetch priority', () => {
            expect(getImageLinkAttributes({...imageProps, loading: 'lazy'})).toBeUndefined()
        })

        test('image properties with fetch priority', () => {
            expect(
                getImageLinkAttributes({...imageProps, loading: 'lazy', fetchPriority: 'high'})
            ).toBeUndefined()
        })

        test('image properties with fetch priority, sizes and srcSet', () => {
            expect(
                getImageLinkAttributes({
                    ...imageProps,
                    loading: 'eager',
                    fetchPriority: 'lazy',
                    sizes: '100vw',
                    srcSet: `${imageProps.src} 240w`
                })
            ).toBeUndefined()
        })
    })
})
