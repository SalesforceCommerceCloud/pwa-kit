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
import {useSearchParams, stringify, parse} from './use-search-params'

const MockComponent = () => {
    const [params] = useSearchParams()

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
            '{"limit":25,"offset":0,"sort":"best-matches","refine":{}}'
        )
    })

    test('returns an object with the parsed search params.', () => {
        const history = createMemoryHistory()
        history.push(
            '/test/path?limit=25&offset=0&refine=c_refinementColor%3DBlack%7CPurple&sort=best-matches'
        )

        const wrapper = render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )

        expect(wrapper.getByTestId('limits').text).toEqual(
            '{"limit":25,"offset":0,"sort":"best-matches","refine":{"c_refinementColor":["Black","Purple"]}}'
        )
    })

    test('test stringy method', () => {
        const objectToStringify = {
            limit: '25',
            offset: '0',
            refine: {
                c_refinementColor: ['Black', 'Purple']
            },
            sort: 'best-matches'
        }

        const stringifiedObject = stringify(objectToStringify)
        expect(stringifiedObject).toEqual(
            'limit=25&offset=0&refine=c_refinementColor%3DBlack%7CPurple&sort=best-matches'
        )
    })

    test('test parse method', () => {
        const stringToParse =
            'limit=25&offset=0&refine=c_refinementColor%3DBlack%7CPurple&sort=best-matches'

        const parsedString = parse(stringToParse)
        expect(parsedString).toEqual(
            {
                limit: 25,
                offset: 0,
                refine: {c_refinementColor: ['Black', 'Purple']},
                sort: 'best-matches'
            } // eslint-disable-line
        )
    })
})
