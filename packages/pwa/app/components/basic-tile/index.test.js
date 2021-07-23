import React from 'react'
import {renderWithProviders} from '../../utils/test-utils'
import BasicTile from './index'

test('BasicTile renders without errors', () => {
    const data = {
        title: 'title',
        href: '/category/womens-outfits',
        img: {
            src: 'src',
            alt: 'alt'
        }
    }
    const {getByText} = renderWithProviders(<BasicTile {...data} />)

    expect(getByText('title')).toBeInTheDocument()
})
