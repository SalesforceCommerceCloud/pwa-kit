/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import DrawerMenu from './index'
import {renderWithProviders} from '../../utils/test-utils'
import {mockCategories} from '../../mocks/mock-data'
import {createServer} from '../../../jest-setup'

describe('DrawerMenu', () => {
    createServer()
    test('Renders DrawerMenu without errors', async () => {
        renderWithProviders(<DrawerMenu isOpen={true} root={mockCategories.root} />)

        const drawer = document.querySelector('.chakra-portal')
        const accordion = document.querySelector('.chakra-accordion')
        const socialIcons = document.querySelector('.sf-social-icons')

        expect(drawer).toBeInTheDocument()
        expect(accordion).toBeInTheDocument()
        expect(socialIcons).toBeInTheDocument()
    })
    test('Renders DrawerMenu Spinner without root', async () => {
        renderWithProviders(<DrawerMenu isOpen={true} />, {
            wrapperProps: {initialCategories: {}}
        })

        const spinner = document.querySelector('.chakra-spinner')

        expect(spinner).toBeInTheDocument()
    })
})
