/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import LocaleText from '@salesforce/retail-react-app/app/components/locale-text/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

test('Renders LocaleText', () => {
    renderWithProviders(
        <div>
            <LocaleText shortCode="en-GB" />
        </div>
    )
    const el = document.querySelector('div')
    expect(el.textContent).toBe('English (United Kingdom)')
})

test('Warns on missing shortCode message definition', () => {
    jest.spyOn(console, 'error')

    renderWithProviders(
        <div>
            <LocaleText shortCode="fa-KE" />
        </div>
    )

    const el = document.querySelector('div')

    expect(console.error.mock.calls[0][0]).toContain(
        `No locale message found for "fa-KE". Please update the list accordingly.`
    )
    expect(el.textContent).toBe('Unknown fa-KE')
})
