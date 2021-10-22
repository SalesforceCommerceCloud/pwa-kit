/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {fireEvent} from '@testing-library/react'
import LocaleSelector from './index'
import {renderWithProviders} from '../../utils/test-utils'

const supportedLocales = [
    {
        id: 'en-GB',
        preferredCurrency: 'GBP'
    },
    {
        id: 'fr-FR',
        preferredCurrency: 'EUR'
    },
    {
        id: 'it-IT',
        preferredCurrency: 'EUR'
    },
    {
        id: 'zh-CN',
        preferredCurrency: 'CNY'
    },
    {
        id: 'ja-JP',
        preferredCurrency: 'JPY'
    }
]

test('Renders LocaleSelector', () => {
    renderWithProviders(<LocaleSelector selectedLocale="en-GB" locales={supportedLocales} />)
    const accordion = document.querySelector('.chakra-accordion')
    const selectedLocale = document.querySelector('button[aria-expanded="false"]')

    expect(accordion).toBeInTheDocument()
    expect(selectedLocale).toBeInTheDocument()
})

test('Renders LocaleSelector with event handlers', () => {
    const onSelect = jest.fn()

    renderWithProviders(
        <LocaleSelector selectedLocale="fr-FR" locales={supportedLocales} onSelect={onSelect} />
    )

    const firstLocale = document.querySelector(
        '.chakra-accordion .chakra-accordion button.chakra-accordion__button'
    )

    fireEvent.click(firstLocale)
    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toBeCalledWith('en-GB')
})
