/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import Refinements from '@salesforce/retail-react-app/app/pages/product-list/partials/refinements'
import {FILTER_ACCORDION_SATE} from '@salesforce/retail-react-app/app/constants'

const filters = [
    {
        attributeId: 'c_refinementColor',
        label: 'Colour',
        values: [{hitCount: 13, label: 'Beige', presentationId: 'beige', value: 'Beige'}]
    },
    {
        attributeId: 'c_size',
        label: 'Size',
        values: [{hitCount: 9, label: 'M', presentationId: 'm', value: 'M'}]
    }
]

const renderRefinements = () =>
    renderWithProviders(
        <Refinements filters={filters} toggleFilter={jest.fn()} selectedFilters={{}} />
    )

const accordionButtons = () => screen.getAllByRole('button', {name: /colour|size/i})

describe('Refinements', () => {
    beforeEach(() => {
        window.localStorage.clear()
    })

    afterEach(() => {
        window.localStorage.clear()
    })

    test('opens every filter accordion when there is no saved state', () => {
        renderRefinements()

        const buttons = accordionButtons()
        expect(buttons).toHaveLength(filters.length)
        buttons.forEach((button) => expect(button).toHaveAttribute('aria-expanded', 'true'))
    })

    test('opens every filter accordion when saved state is an empty selection', () => {
        // A user who collapsed every panel previously persists `[]`. An empty saved
        // selection means "nothing pinned open", which must fall through to the
        // default-open state — not collapse every panel.
        window.localStorage.setItem(FILTER_ACCORDION_SATE, JSON.stringify([]))

        renderRefinements()

        const buttons = accordionButtons()
        expect(buttons).toHaveLength(filters.length)
        buttons.forEach((button) => expect(button).toHaveAttribute('aria-expanded', 'true'))
    })

    test('opens only the filters named in saved state', () => {
        window.localStorage.setItem(FILTER_ACCORDION_SATE, JSON.stringify(['c_size']))

        renderRefinements()

        expect(screen.getByRole('button', {name: /colour/i})).toHaveAttribute(
            'aria-expanded',
            'false'
        )
        expect(screen.getByRole('button', {name: /size/i})).toHaveAttribute('aria-expanded', 'true')
    })
})
