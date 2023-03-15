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
import {useSortUrls} from './use-sort-urls'

const MOCK_SORT_OPTIONS = [{id: 'high-to-low'}, {id: 'low-to-high'}]

const MockComponent = () => {
    const urls = useSortUrls({options: MOCK_SORT_OPTIONS})

    return (
        <script data-testid="limits" type="application/json">
            {JSON.stringify(urls)}
        </script>
    )
}

describe('The useSortUrls', () => {
    test('returns an array of urls, one values for each sort value.', () => {
        const history = createMemoryHistory()
        history.push('/test/path')

        const wrapper = render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )

        expect(wrapper.getByTestId('limits').text).toEqual(
            '["/test/path?sort=high-to-low&offset=0","/test/path?sort=low-to-high&offset=0"]'
        )
    })
})
