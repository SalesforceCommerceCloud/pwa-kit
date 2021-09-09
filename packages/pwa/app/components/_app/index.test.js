/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'

import App from './index.jsx'
import {renderWithProviders} from '../../utils/test-utils'
import {DEFAULT_LOCALE} from '../../constants'

let windowSpy

beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(jest.fn())
    jest.spyOn(console, 'groupCollapsed').mockImplementation(jest.fn())
})

afterAll(() => {
    console.log.mockRestore()
    console.groupCollapsed.mockRestore()
})
beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get')
})

afterEach(() => {
    console.log.mockClear()
    console.groupCollapsed.mockClear()
    windowSpy.mockRestore()
})

describe('App', () => {
    test('App component is rendered appropriately', () => {
        renderWithProviders(
            <App targetLocale={DEFAULT_LOCALE} defaultLocale={DEFAULT_LOCALE}>
                <p>Any children here</p>
            </App>
        )
        expect(screen.getByRole('main')).toBeInTheDocument()
        expect(screen.getByText('Any children here')).toBeInTheDocument()
    })

    test('shouldGetProps returns true only server-side', () => {
        windowSpy.mockImplementation(() => undefined)

        expect(App.shouldGetProps()).toBe(true)

        windowSpy.mockImplementation(() => ({
            location: {
                origin: 'http://localhost:3000/'
            }
        }))
        expect(App.shouldGetProps()).toBe(false)
    })
})
