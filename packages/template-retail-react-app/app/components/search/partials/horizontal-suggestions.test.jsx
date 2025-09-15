/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import HorizontalSuggestions from '@salesforce/retail-react-app/app/components/search/partials/horizontal-suggestions'

jest.mock('@salesforce/retail-react-app/app/components/dynamic-image', () => {
    return function MockDynamicImage(props) {
        const {src, widths, imageProps} = props || {}
        return (
            <img
                data-testid="dynamic-image"
                data-src={src}
                data-widths={(widths || []).join(',')}
                alt={imageProps?.alt ?? ''}
            />
        )
    }
})

const sampleSuggestions = [
    {
        link: '/product-1',
        image: 'https://example.com/image-1.jpg',
        name: 'Product 1',
        price: '29.99'
    },
    {
        link: '/product-2',
        name: 'Product 2'
    }
]

test('returns null when suggestions are undefined', () => {
    renderWithProviders(
        <HorizontalSuggestions suggestions={undefined} closeAndNavigate={jest.fn()} />
    )
    expect(screen.queryByTestId('sf-horizontal-product-suggestions')).not.toBeInTheDocument()
})

test('renders product tiles with names and optional prices', () => {
    renderWithProviders(
        <HorizontalSuggestions suggestions={sampleSuggestions} closeAndNavigate={jest.fn()} />
    )

    // container
    expect(screen.getByTestId('sf-horizontal-product-suggestions')).toBeInTheDocument()

    // tiles
    const tiles = screen.getAllByTestId('product-tile')
    expect(tiles).toHaveLength(2)

    // names
    expect(screen.getByText('Product 1')).toBeInTheDocument()
    expect(screen.getByText('Product 2')).toBeInTheDocument()

    // price only for first suggestion
    expect(screen.getByText('$29.99')).toBeInTheDocument()
})

test('renders DynamicImage when image is provided and passes widths via dynamicImageProps', () => {
    const dynamicImageProps = {widths: [200, 400, 800]}
    renderWithProviders(
        <HorizontalSuggestions
            suggestions={sampleSuggestions}
            closeAndNavigate={jest.fn()}
            dynamicImageProps={dynamicImageProps}
        />
    )

    const images = screen.getAllByTestId('dynamic-image')
    // Only first suggestion has an image
    expect(images).toHaveLength(1)

    const img = images[0]
    // src should be appended with the width token by the component
    expect(img.getAttribute('data-src')).toBe(`${sampleSuggestions[0].image}[?sw={width}&q=60]`)
    expect(img.getAttribute('data-widths')).toBe('200,400,800')
})

test('does not render DynamicImage when image is absent', () => {
    renderWithProviders(
        <HorizontalSuggestions suggestions={[sampleSuggestions[1]]} closeAndNavigate={jest.fn()} />
    )

    expect(screen.queryByTestId('dynamic-image')).not.toBeInTheDocument()
})

test('clicking a product tile triggers closeAndNavigate with the link', async () => {
    const user = userEvent.setup()
    const closeAndNavigate = jest.fn()

    renderWithProviders(
        <HorizontalSuggestions
            suggestions={sampleSuggestions}
            closeAndNavigate={closeAndNavigate}
        />
    )

    const tiles = screen.getAllByTestId('product-tile')
    await user.click(tiles[1])

    expect(closeAndNavigate).toHaveBeenCalledWith(sampleSuggestions[1].link)
})
