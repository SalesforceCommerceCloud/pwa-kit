import React from 'react'
import {renderWithProviders} from '../../../utils/test-utils'
import Button from './index'

test('Button renders without errors', () => {
    const data = {
        label: 'title',
        url: '/category/womens-outfits'
    }
    const {getByText} = renderWithProviders(<Button {...data} />)

    expect(getByText('title')).toBeInTheDocument()
})
