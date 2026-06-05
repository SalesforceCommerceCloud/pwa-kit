/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {act, screen} from '@testing-library/react'
import {renderToString} from 'react-dom/server'
import {IntlProvider} from 'react-intl'
import {ChakraProvider} from '@salesforce/retail-react-app/app/components/shared/ui'
import theme from '@salesforce/retail-react-app/app/theme'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import Refinements from '@salesforce/retail-react-app/app/pages/product-list/partials/refinements'
import CategoryLinks from '@salesforce/retail-react-app/app/pages/product-list/partials/category-links'
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

    test('recomputes effective filters when excludedFilters changes but filters is unchanged', () => {
        // The parent can hand a stable `filters` reference while changing `excludedFilters`.
        // The effective-filters memo must react to the exclusions, not only the filters array.
        // `renderWithProviders` captures its `children` in the wrapper, so a prop-changing
        // rerender has to drive the component through a state-holding harness instead.
        let setExcluded
        const Harness = () => {
            const [excludedFilters, _setExcluded] = React.useState([])
            setExcluded = _setExcluded
            return (
                <Refinements
                    filters={filters}
                    excludedFilters={excludedFilters}
                    toggleFilter={jest.fn()}
                    selectedFilters={{}}
                />
            )
        }
        renderWithProviders(<Harness />)
        expect(screen.getByRole('button', {name: /size/i})).toBeInTheDocument()

        act(() => setExcluded(['c_size']))

        expect(screen.queryByRole('button', {name: /size/i})).not.toBeInTheDocument()
        expect(screen.getByRole('button', {name: /colour/i})).toBeInTheDocument()
    })
})

// `renderToString` runs no effects, mirroring real server-side rendering. The
// JSDOM tests above can't catch the SSR-closed regression because JSDOM runs
// layout effects and so always reports the hydrated (open) state.
const renderToStringWithProviders = (node) =>
    renderToString(
        <IntlProvider locale="en-GB" defaultLocale="en-GB">
            <ChakraProvider theme={theme}>{node}</ChakraProvider>
        </IntlProvider>
    )

describe('Refinements server-side rendering', () => {
    test('renders every filter panel open server-side', () => {
        const html = renderToStringWithProviders(
            <Refinements filters={filters} toggleFilter={jest.fn()} selectedFilters={{}} />
        )

        const expandedStates = html.match(/aria-expanded="(true|false)"/g)
        expect(expandedStates).toHaveLength(filters.length)
        expect(expandedStates.every((state) => state === 'aria-expanded="true"')).toBe(true)
    })

    test('renders the category panel open server-side', () => {
        const html = renderToStringWithProviders(<CategoryLinks category={{categories: []}} />)

        expect(html).toContain('aria-expanded="true"')
        expect(html).not.toContain('aria-expanded="false"')
    })
})
