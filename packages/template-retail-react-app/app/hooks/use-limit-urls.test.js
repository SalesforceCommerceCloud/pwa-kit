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
import {useLimitUrls} from '@salesforce/retail-react-app/app/hooks/use-limit-urls'

const MockComponent = () => {
    const urls = useLimitUrls()

    return (
        <script data-testid="limits" type="application/json">
            {JSON.stringify(urls)}
        </script>
    )
}

describe('The useLimitUrls', () => {
    test('returns an array of urls, one values for each limit value.', () => {
        const history = createMemoryHistory()
        history.push('/test/path')

        const wrapper = render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )

        expect(wrapper.getByTestId('limits').text).toBe(
            '["/test/path?limit=25&offset=0","/test/path?limit=50&offset=0","/test/path?limit=100&offset=0"]'
        )
    })
})
