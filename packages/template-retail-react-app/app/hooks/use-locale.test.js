/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {createMemoryHistory} from 'history'
import {screen} from '@testing-library/react'
import {Router} from 'react-router'
import React from 'react'

import useLocale from './use-locale'
import {renderWithReactIntl} from '../utils/test-utils'

const MockComponent = () => {
    const {locale} = useLocale()
    return <div data-testid="locale">{JSON.stringify(locale)}</div>
}

describe('useLocale', function() {
    test('return the default locale', () => {
        const history = createMemoryHistory()
        history.push('/test/path')
        renderWithReactIntl(
            <Router history={history}>
                <MockComponent />
            </Router>
        )
        expect(screen.getByTestId('locale')).toHaveTextContent(
            '{"id":"en-GB","preferredCurrency":"GBP"}'
        )
    })

    test('return the locale object that matches the site (from the url) and the locale from intl', () => {
        const history = createMemoryHistory()
        history.push('/us/en-CA/test/path')
        renderWithReactIntl(
            <Router history={history}>
                <MockComponent />
            </Router>,
            'en-CA'
        )
        expect(screen.getByTestId('locale')).toHaveTextContent(
            '{"id":"en-CA","preferredCurrency":"USD"}'
        )
    })
})
