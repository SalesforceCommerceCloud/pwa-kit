import React from 'react'
import Breadcrumb from './index'
import {renderWithProviders} from '../../utils/test-utils'

const mockCategories = [
    {
        id: 1,
        name: 'Category 1'
    },
    {
        id: 2,
        name: 'Category 2'
    },
    {
        id: 3,
        name: 'Category 3'
    }
]

test('Renders Breadcrum', () => {
    const {getAllByTestId} = renderWithProviders(<Breadcrumb categories={mockCategories} />)

    expect(getAllByTestId('sf-crumb-item').length).toEqual(mockCategories.length)
})
