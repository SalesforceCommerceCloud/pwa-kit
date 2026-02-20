/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Router} from 'react-router'
import PropTypes from 'prop-types'

import {render} from '@testing-library/react'
import {createMemoryHistory} from 'history'
import {useVariationParams} from '@salesforce/retail-react-app/app/hooks/use-variation-params'

// Below is a partial product used for mocking purposes. Note: only the properties
// that are used in the hook at defined.
const MockProduct = {
    variationAttributes: [
        {id: 'color', name: 'Color', values: []},
        {id: 'size', name: 'Size', values: []}
    ]
}

const MockComponent = ({controlledValues = null}) => {
    const params = useVariationParams(MockProduct, false, false, controlledValues)

    return (
        <script data-testid="params" type="application/json">
            {JSON.stringify(params)}
        </script>
    )
}

MockComponent.propTypes = {
    controlledValues: PropTypes.object
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

        expect(wrapper.getByTestId('params').text).toBe('{"color":"blue","size":"2"}')
    })

    test('returns correct params when there are non-product params in the url.', () => {
        const history = createMemoryHistory()
        history.push('/test/path?color=blue&size=2&nonproductattribute=true')

        const wrapper = render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )

        expect(wrapper.getByTestId('params').text).toBe('{"color":"blue","size":"2"}')
    })

    test('returns correct params when there is only a subset product params in the url.', () => {
        const history = createMemoryHistory()
        history.push('/test/path?color=blue')

        const wrapper = render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )

        expect(wrapper.getByTestId('params').text).toBe('{"color":"blue"}')
    })

    test('uses controlled values instead of URL params when provided (controlled mode)', () => {
        const history = createMemoryHistory()
        history.push('/test/path?color=blue&size=M')

        const controlledValues = {color: 'red', size: 'L'}

        const wrapper = render(
            <Router history={history}>
                <MockComponent controlledValues={controlledValues} />
            </Router>
        )

        // Should use controlled values, not URL params
        expect(wrapper.getByTestId('params').text).toBe('{"color":"red","size":"L"}')
    })

    test('ignores URL params completely in controlled mode', () => {
        const history = createMemoryHistory()
        history.push('/test/path?color=blue&size=M&extra=ignored')

        const controlledValues = {size: 'XL'}

        const wrapper = render(
            <Router history={history}>
                <MockComponent controlledValues={controlledValues} />
            </Router>
        )

        // Should only use controlled values
        expect(wrapper.getByTestId('params').text).toBe('{"size":"XL"}')
    })

    test('returns empty object when controlled values is null (URL mode)', () => {
        const history = createMemoryHistory()
        history.push('/test/path')

        const wrapper = render(
            <Router history={history}>
                <MockComponent controlledValues={null} />
            </Router>
        )

        expect(wrapper.getByTestId('params').text).toBe('{}')
    })
})
