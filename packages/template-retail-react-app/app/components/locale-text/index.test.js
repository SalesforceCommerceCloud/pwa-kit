/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import LocaleText from './index'
import {renderWithProviders} from '../../utils/test-utils'

test('Renders LocaleText', () => {
    renderWithProviders(<LocaleText shortCode="en-GB" />, {
        wrapperProps: {
            withCommerceApiProvider: false
        }
    })
    const text = document.querySelector('.chakra-text')

    expect(text).toBeInTheDocument()
})

test('Renders LocaleText with as type', () => {
    renderWithProviders(<LocaleText className="test-class" shortCode="en-GB" as="option" />, {
        wrapperProps: {
            withCommerceApiProvider: false
        }
    })

    const text = document.querySelector('option.test-class')

    expect(text).toBeInTheDocument()
})

test('Warns on missing shortCode message definition', () => {
    jest.spyOn(console, 'error')

    renderWithProviders(<LocaleText shortCode="fa-KE" />, {
        wrapperProps: {
            withCommerceApiProvider: false
        }
    })

    const text = document.querySelector('.chakra-text')

    expect(console.error.mock.calls[0][0]).toContain(
        `No locale message found for "fa-KE". Please update the list accordingly.`
    )
    expect(text).toBeInTheDocument()
})
