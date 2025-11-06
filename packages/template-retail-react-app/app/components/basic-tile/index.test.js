/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import BasicTile from '@salesforce/retail-react-app/app/components/basic-tile/index'
import {screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('BasicTile', () => {
    const data = {
        title: 'title',
        href: '/category/womens-outfits',
        img: {
            src: 'src',
            alt: 'alt'
        }
    }

    test('BasicTile renders without errors', () => {
        const {getByText} = renderWithProviders(<BasicTile {...data} />)
        expect(getByText('title')).toBeInTheDocument()
    })

    test('renders image with correct attributes', () => {
        renderWithProviders(<BasicTile {...data} />)
        const image = screen.getByAltText('alt')
        expect(image).toBeInTheDocument()
        expect(image).toHaveAttribute('src', 'src')
    })

    test('renders with custom props', () => {
        const custom = {
            ...data,
            padding: '4',
            margin: '2'
        }
        renderWithProviders(<BasicTile {...custom} />)
        const container = screen.getByText('title').closest('div').parentElement
        expect(container).toHaveStyle('padding: 4')
        expect(container).toHaveStyle('margin: 2')
    })

    test('renders image link with correct href', () => {
        renderWithProviders(<BasicTile {...data} />)
        const imageLink = screen.getByAltText('alt').closest('a')
        expect(imageLink).toHaveAttribute('href', '/category/womens-outfits')
    })

    test('title is interactive and has hover capability', async () => {
        const user = userEvent.setup()
        renderWithProviders(<BasicTile {...data} />)
        const title = screen.getByText('title')

        // Test that the title is within a clickable link
        const titleLink = title.closest('a')
        expect(titleLink).toBeInTheDocument()
        expect(titleLink).toHaveAttribute('href', '/category/womens-outfits')

        // Test that hover events can be triggered (this confirms the element is interactive)
        await user.hover(title)
        // No error should occur during hover - this tests the interactive behavior
    })
})
