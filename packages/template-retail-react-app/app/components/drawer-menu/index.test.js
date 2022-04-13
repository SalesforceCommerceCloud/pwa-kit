/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import DrawerMenu from './index'
import {renderWithProviders} from '../../utils/test-utils'

const mockRoot = {
    id: 't1',
    name: 'Test One',
    categories: [
        {
            id: 't1-1',
            name: 'Test One One'
        },
        {
            id: 't1-2',
            name: 'Test One Two',
            categories: [
                {
                    id: 't1-2-1',
                    name: 'Test One Two One'
                },
                {
                    id: 't1-2-2',
                    name: 'Test One Two Two'
                }
            ]
        }
    ]
}

test('Renders DrawerMenu with root', () => {
    renderWithProviders(<DrawerMenu root={mockRoot} isOpen={true} />)

    const drawer = document.querySelector('.chakra-portal')
    const accordion = document.querySelector('.chakra-accordion')
    const socialIcons = document.querySelector('.sf-social-icons')

    expect(drawer).toBeInTheDocument()
    expect(accordion).toBeInTheDocument()
    expect(socialIcons).toBeInTheDocument()
})

test('Renders DrawerMenu Spinner without root', () => {
    renderWithProviders(<DrawerMenu isOpen={true} />)

    const spinner = document.querySelector('.chakra-spinner')

    expect(spinner).toBeInTheDocument()
})
