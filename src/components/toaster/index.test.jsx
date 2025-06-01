/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable react/prop-types */
import React from 'react'
import {waitFor, within} from '@testing-library/react'
import '@testing-library/jest-dom'
import {createToaster} from '@chakra-ui/react'
import Toaster, {toaster} from './index'
import {renderWithProviders} from '../../utils/test-utils'

describe('Toaster Tests', () => {
    it('renders toast group container', () => {
        renderWithProviders(<Toaster toaster={toaster} />)
        
        const toastGroup = document.querySelector('[data-scope="toast"]')
        expect(toastGroup).toBeInTheDocument()
    })

    it('renders toast group with correct placement', () => {
        renderWithProviders(<Toaster toaster={toaster} />)
        const toastGroup = document.querySelector('[data-placement="top-end"]')
        expect(toastGroup).toBeInTheDocument()
    })

    it('renders with custom toaster placement', () => {
        const testToaster = createToaster({
            placement: 'bottom-start'
        })
        renderWithProviders(<Toaster toaster={testToaster} />)
        const toastGroup = document.querySelector('[data-placement="bottom-start"]')
        expect(toastGroup).toBeInTheDocument()
        expect(toastGroup).toHaveAttribute('id', 'toast-group:bottom-start')
    })

    it('exports toaster instance with correct API', () => {
        expect(toaster).toBeDefined()
        expect(typeof toaster).toBe('object')
        expect(typeof toaster.create).toBe('function')
        expect(typeof toaster.dismiss).toBe('function')
        expect(typeof toaster.update).toBe('function')
    })

    it('can create and render a toast', async () => {
        renderWithProviders(<Toaster toaster={toaster} />)

        await waitFor(() => {
            const toastGroup = document.querySelector('[data-scope="toast"]')
            expect(toastGroup).toBeInTheDocument()
        })

        toaster.create({
            title: 'Test Toast',
            description: 'This is a test description',
            type: 'success'
        })

        await waitFor(() => {
            expect(within(document.body).getByText('Test Toast')).toBeInTheDocument()
            expect(within(document.body).getByText('This is a test description')).toBeInTheDocument()
        })
    })
})
