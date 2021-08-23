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
import {useSearchParams} from './use-search-params'

const MockComponent = () => {
    const params = useSearchParams()

    return (
        <script data-testid="limits" type="application/json">
            {JSON.stringify(params)}
        </script>
    )
}

describe('The useSearchParams', () => {
    test('returns an object with the default search params when none are present in the url.', () => {
        const history = createMemoryHistory()
        history.push('/test/path')

        const wrapper = render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )

        expect(wrapper.getByTestId('limits').text).toEqual(
            '{"limit":25,"offset":0,"sort":"best-matches"}'
        )
    })

    test('returns an object with the parsed search params.', () => {
        const history = createMemoryHistory()
        history.push('/test/path?sort=high-to-low&offset=0&limit=25')

        const wrapper = render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )

        expect(wrapper.getByTestId('limits').text).toEqual(
            '{"limit":25,"offset":0,"sort":"high-to-low"}'
        )
    })
})
