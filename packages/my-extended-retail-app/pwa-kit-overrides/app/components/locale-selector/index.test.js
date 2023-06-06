/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {fireEvent} from '@testing-library/react'
import LocaleSelector from '@salesforce/retail-react-app/app/components/locale-selector/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'

const supportedLocales = ['en-GB', 'fr-FR', 'it-IT', 'zh-CN', 'ja-JP']

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
    expect(onSelect).toHaveBeenCalledWith('en-GB')
})
