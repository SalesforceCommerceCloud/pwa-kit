/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {createMemoryHistory} from 'history'
import {render, screen} from '@testing-library/react'
import {Router} from 'react-router'
import React from 'react'
import useSite from './use-site'

afterEach(() => {
    jest.clearAllMocks()
})

const MockComponent = () => {
    const site = useSite()
    return <div data-testid="site">{JSON.stringify(site)}</div>
}

describe('useSite', function() {
    test('returns the default site when there is no ref in the url ', () => {
        const history = createMemoryHistory()
        history.push('/test/path')
        render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )
        expect(screen.getByTestId('site')).toHaveTextContent(
            '{"id":"site-1","l10n":{"defaultLocale":"en-GB","supportedLocales":[{"id":"en-GB","preferredCurrency":"GBP"},{"id":"fr-FR","alias":"fr","preferredCurrency":"EUR"},{"id":"it-IT","preferredCurrency":"EUR"}]},"alias":"uk"}'
        )
    })

    test('returns site-2 as the result ', () => {
        const history = createMemoryHistory()
        history.push('/us/test/path')
        render(
            <Router history={history}>
                <MockComponent />
            </Router>
        )
        expect(screen.getByTestId('site')).toHaveTextContent(
            '{"id":"site-2","l10n":{"defaultLocale":"en-US","supportedLocales":[{"id":"en-US","preferredCurrency":"USD"},{"id":"en-CA","preferredCurrency":"USD"}]},"alias":"us"}'
        )
    })
})
