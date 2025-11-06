/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable jest/no-conditional-expect */
import React from 'react'
import {Helmet} from 'react-helmet'
import Image from '@salesforce/retail-react-app/app/components/image/index'
import {Img} from '@salesforce/retail-react-app/app/components/shared/ui'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {isServer} from '@salesforce/retail-react-app/app/components/image/utils'

jest.mock('@salesforce/retail-react-app/app/components/image/utils', () => ({
    ...jest.requireActual('@salesforce/retail-react-app/app/components/image/utils'),
    isServer: jest.fn().mockReturnValue(true)
}))

const imageProps = {
    src: 'https://edge.disstg.commercecloud.salesforce.com/dw/image/v2/ZZRF_001/on/demandware.static/-/Sites-apparel-m-catalog/default/dw4cd0a798/images/large/PG.10216885.JJ169XX.PZ.jpg',
    alt: 'Ruffle Front V-Neck Cardigan, large',
    title: 'Ruffle Front V-Neck Cardigan'
}

describe('Image Component', () => {
    test('renders an image without decoding strategy and fetch priority', () => {
        const {getAllByTitle} = renderWithProviders(<Image {...imageProps} />)
        const elements = getAllByTitle(imageProps.title)
        expect(elements).toHaveLength(1)
        expect(elements[0]).not.toHaveAttribute('decoding')
        expect(elements[0]).not.toHaveAttribute('fetchpriority')
    })

    describe('loading="lazy"', () => {
        test('renders an image using the default "async" decoding strategy', () => {
            const {getAllByTitle} = renderWithProviders(<Image {...imageProps} loading={'lazy'} />)
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('decoding', 'async')
        })

        test.each(['sync', 'async', 'auto'])(
            'renders an image using an explicit "%s" decoding strategy',
            (decoding) => {
                const {getAllByTitle} = renderWithProviders(
                    <Image {...imageProps} loading={'lazy'} decoding={decoding} />
                )
                const elements = getAllByTitle(imageProps.title)
                expect(elements).toHaveLength(1)
                expect(elements[0]).toHaveAttribute('decoding', decoding)
            }
        )

        test('renders an image replacing an invalid decoding strategy with the default "async" value', () => {
            const {getAllByTitle} = renderWithProviders(
                <Image {...imageProps} loading={'lazy'} decoding={'invalid'} />
            )
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('decoding', 'async')
        })

        test('render an explicitly given image component with attribute modifications', () => {
            const {getAllByTitle} = renderWithProviders(
                <Image as={Img} {...imageProps} loading={'lazy'} />
            )
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('decoding', 'async')
        })
    })

    describe('loading="eager"', () => {
        test('renders an image using the default "high" fetch priority', () => {
            const {getAllByTitle} = renderWithProviders(<Image {...imageProps} loading={'eager'} />)
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('fetchpriority', 'high')

            const helmet = Helmet.peek()
            expect(helmet.linkTags).toHaveLength(1)
            expect(helmet.linkTags[0]).toStrictEqual({
                as: 'image',
                href: imageProps.src,
                rel: 'preload',
                fetchPriority: 'high'
            })
        })

        test.each(['high', 'low', 'auto'])(
            'renders an image using an explicit "%s" fetch priority',
            (fetchPriority) => {
                const {getAllByTitle} = renderWithProviders(
                    <Image {...imageProps} loading={'eager'} fetchPriority={fetchPriority} />
                )
                const elements = getAllByTitle(imageProps.title)
                expect(elements).toHaveLength(1)
                expect(elements[0]).toHaveAttribute('fetchpriority', fetchPriority)

                const helmet = Helmet.peek()
                if (fetchPriority === 'high') {
                    expect(helmet.linkTags).toHaveLength(1)
                    expect(helmet.linkTags[0]).toStrictEqual({
                        as: 'image',
                        href: imageProps.src,
                        rel: 'preload',
                        fetchPriority: 'high'
                    })
                } else {
                    expect(helmet.linkTags).toStrictEqual([])
                }
            }
        )

        test('renders an image replacing an invalid fetch priority with the default "auto" value', () => {
            const {getAllByTitle} = renderWithProviders(
                <Image {...imageProps} loading={'eager'} fetchPriority={'invalid'} />
            )
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('fetchpriority', 'auto')
            expect(Helmet.peek().linkTags).toStrictEqual([])
        })

        test('renders an explicitly given image component without modifications', () => {
            const {getAllByTitle} = renderWithProviders(
                <Image as={Img} {...imageProps} loading={'eager'} />
            )
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('fetchpriority', 'high')

            const helmet = Helmet.peek()
            expect(helmet.linkTags).toHaveLength(1)
            expect(helmet.linkTags[0]).toStrictEqual({
                as: 'image',
                href: imageProps.src,
                rel: 'preload',
                fetchPriority: 'high'
            })
        })

        test('renders an image on the client', () => {
            isServer.mockReturnValue(false)
            const {getAllByTitle} = renderWithProviders(<Image {...imageProps} loading={'eager'} />)
            const elements = getAllByTitle(imageProps.title)
            expect(elements).toHaveLength(1)
            expect(elements[0]).toHaveAttribute('fetchpriority', 'high')
            expect(Helmet.peek().linkTags).toStrictEqual([])
        })
    })
})
