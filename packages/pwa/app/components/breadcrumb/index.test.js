/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
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
