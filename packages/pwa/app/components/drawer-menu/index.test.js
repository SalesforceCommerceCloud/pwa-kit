/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
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
    const localeSelector = document.querySelector('.sf-locale-selector')
    const socialIcons = document.querySelector('.sf-social-icons')

    expect(drawer).toBeInTheDocument()
    expect(accordion).toBeInTheDocument()
    expect(localeSelector).toBeInTheDocument()
    expect(socialIcons).toBeInTheDocument()
})

test('Renders DrawerMenu Spinner without root', () => {
    renderWithProviders(<DrawerMenu isOpen={true} />)

    const spinner = document.querySelector('.chakra-spinner')

    expect(spinner).toBeInTheDocument()
})
