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
import {useVariationParams} from './use-variation-params'

// Below is a partial product used for mocking purposes. Note: only the properties
// that are used in the hook at defined.
const MockProduct = {
    variationAttributes: [
        {id: 'color', name: 'Color', values: []},
        {id: 'size', name: 'Size', values: []}
    ]
}

const MockComponent = () => {
    const params = useVariationParams(MockProduct)

    return (
        <script data-testid="params" type="application/json">
            {JSON.stringify(params)}
        </script>
    )
}

describe('The useVariationParams', () => {
    test('returns correct params when there are no non-product params in the url.', () => {
        const history = createMemoryHistory()
        history.push('/test/path?color=blue&size=2')

        const wrapper = render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )

        expect(wrapper.getByTestId('params').text).toEqual('{"color":"blue","size":"2"}')
    })

    test('returns correct params when there are non-product params in the url.', () => {
        const history = createMemoryHistory()
        history.push('/test/path?color=blue&size=2&nonproductattribute=true')

        const wrapper = render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )

        expect(wrapper.getByTestId('params').text).toEqual('{"color":"blue","size":"2"}')
    })

    test('returns correct params when there is only a subset product params in the url.', () => {
        const history = createMemoryHistory()
        history.push('/test/path?color=blue')

        const wrapper = render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )

        expect(wrapper.getByTestId('params').text).toEqual('{"color":"blue"}')
    })
})
