/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen, fireEvent} from '@testing-library/react'
import ListMenu from './index'
import {renderWithProviders} from '../../utils/test-utils'

const mockRoot = {
    id: 't1',
    name: 'Test One',
    categories: [
        {
            id: 't1-1',
            name: 'Level one Test One One'
        },
        {
            id: 't1-2',
            name: 'Level one Test One Two',
            categories: [
                {
                    id: 't1-2-1',
                    name: 'Level two Test One Two One',
                    categories: [
                        {
                            id: 't1-2-1-1',
                            name: 'Level three Test One Two One One'
                        },
                        {
                            id: 't1-2-2-2',
                            name: 'Level three Test One Two Two Two'
                        }
                    ]
                },
                {
                    id: 't1-2-2',
                    name: 'Level two Test One Two Two'
                }
            ]
        }
    ]
}

describe('ListMenu', () => {
    test('ListMenu renders without errors', () => {
        renderWithProviders(<ListMenu root={mockRoot} />)

        const popoverTrigger = document.querySelector('[id^="popover-trigger"]')
        fireEvent.mouseOver(popoverTrigger)

        expect(screen.getByRole('navigation', {name: 'main'})).toBeInTheDocument()

        expect(screen.getByText(/level one test one one/i)).toBeInTheDocument()

        expect(screen.getByText(/level two test one two two/i)).not.toBeVisible()

        expect(screen.getByText(/level three test one two two two/i)).not.toBeVisible()
    })

    test('ListMenu renders Spinner without root categories', () => {
        renderWithProviders(<ListMenu />)

        const spinner = document.querySelector('.chakra-spinner')

        expect(spinner).toBeInTheDocument()
    })
})
