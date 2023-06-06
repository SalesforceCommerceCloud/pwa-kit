/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {screen} from '@testing-library/react'

import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import CheckboxRefinements from '@salesforce/retail-react-app/app/pages/product-list/partials/checkbox-refinements'

const data = {
    attributeId: 'c_refinementColor',
    label: 'Colour',
    values: [
        {
            hitCount: 13,
            label: 'Beige',
            presentationId: 'beige',
            value: 'Beige'
        },
        {
            hitCount: 149,
            label: 'Black',
            presentationId: 'black',
            value: 'Black'
        },
        {
            hitCount: 109,
            label: 'Blue',
            presentationId: 'blue',
            value: 'Blue'
        }
    ]
}

describe('Components', function () {
    test('renders without crashing', async () => {
        const onToggleFilter = jest.fn()
        renderWithProviders(
            <CheckboxRefinements
                filter={data}
                toggleFilter={onToggleFilter}
                selectedFilters={['Blue', 'Beige']}
            />
        )
        expect(screen.getByText(/beige/i)).toBeInTheDocument()

        expect(screen.getByText(/blue/i)).toBeInTheDocument()
    })
})
