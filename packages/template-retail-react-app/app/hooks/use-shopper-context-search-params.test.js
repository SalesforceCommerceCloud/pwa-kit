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
import {useShopperContextSearchParams} from '@salesforce/retail-react-app/app/hooks/use-shopper-context-search-params'

const MockComponent = () => {
    const params = useShopperContextSearchParams()

    return (
        <script data-testid="search-params" type="application/json">
            {JSON.stringify(params)}
        </script>
    )
}

describe('The useShopperContextSearchParams', () => {
    test('returns an empty object when no shopper context search params are present in the url.', () => {
        const history = createMemoryHistory()
        history.push('/test/path')

        const wrapper = render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )

        expect(wrapper.getByTestId('search-params').text).toBe('{}')
    })

    test('returns an object with the parsed search params.', () => {
        const history = createMemoryHistory()
        history.push(
            '/test/path?sourceCode=instagram&effectiveDateTime=2024-09-04T00:00:00Z' +
                // Customer Group IDs
                '&customerGroupIds=BigSpenders&customerGroupIds=MobileUsers' +
                // Custom Qualifiers
                '&deviceType=mobile&ipAddress=189.0.0.0&operatingSystem=Android' +
                // Assignment Qualifiers
                '&store=boston'
        )

        const wrapper = render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )

        expect(JSON.parse(wrapper.getByTestId('search-params').text)).toEqual({
            sourceCode: 'instagram',
            effectiveDateTime: '2024-09-04T00:00:00Z',
            customQualifiers: {
                deviceType: 'mobile',
                ipAddress: '189.0.0.0',
                operatingSystem: 'Android'
            },
            assignmentQualifiers: {store: 'boston'},
            customerGroupIds: ['BigSpenders', 'MobileUsers']
        })
    })
})
