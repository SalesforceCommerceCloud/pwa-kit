/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Router} from 'react-router'

import {render} from '@testing-library/react'
import {createMemoryHistory} from 'history'
import {useVariant} from './use-variant'

// Below is a partial product used for mocking purposes. Note: only the properties
// that are used in the hook at defined.
const MockProduct = {
    variationAttributes: [
        {id: 'color', name: 'Color', values: []},
        {id: 'size', name: 'Size', values: []}
    ],
    variants: [
        {
            orderable: true,
            price: 195,
            productId: '883360352473M',
            variationValues: {
                color: 'B9W',
                size: '34'
            }
        },
        {
            orderable: true,
            price: 195,
            productId: '883360492148M',
            variationValues: {
                color: 'DKL',
                size: '34'
            }
        }
    ]
}

const MockComponent = () => {
    const variant = useVariant(MockProduct)
    return (
        <script data-testid="variant" type="application/json">
            {JSON.stringify(variant)}
        </script>
    )
}

describe('The useVariant', () => {
    test('returns undefined when a single variant cannot be deduced from the location search params.', () => {
        const history = createMemoryHistory()
        history.push('/test/path?size=34')

        const wrapper = render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )

        expect(wrapper.getByTestId('variant').text).toEqual('')
    })

    test('returns the correct variant when one can be deduced from the location search params.', () => {
        const history = createMemoryHistory()
        history.push('/test/path?size=34&color=DKL')

        const wrapper = render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )

        expect(wrapper.getByTestId('variant').text).toEqual(
            '{"orderable":true,"price":195,"productId":"883360492148M","variationValues":{"color":"DKL","size":"34"}}'
        )
    })
})
