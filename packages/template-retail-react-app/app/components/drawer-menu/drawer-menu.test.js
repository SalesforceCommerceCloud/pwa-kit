/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import DrawerMenu from '@salesforce/retail-react-app/app/components/drawer-menu/index'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import {mockCategories} from '@salesforce/retail-react-app/app/mocks/mock-data'

describe('DrawerMenu', () => {
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
