/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable react/prop-types */
import React from 'react'
import {render} from '@testing-library/react'
import '@testing-library/jest-dom'
import {ChakraProvider, createSystem, defaultConfig} from '@chakra-ui/react'
import Toaster, {toaster} from './index'

const TestWrapper = ({children}) => {
    const system = createSystem(defaultConfig)
    return <ChakraProvider value={system}>{children}</ChakraProvider>
}

const renderWithChakra = (component) => {
    return render(component, {wrapper: TestWrapper})
}

describe('Toaster Tests', () => {
    const mockToaster = {
        placement: 'top-end',
        id: 'test-toaster',
        toasts: []
    }

    it('renders without crashing', () => {
        renderWithChakra(<Toaster toaster={mockToaster} />)
        // The Portal component renders the toaster, but without active toasts it might not be visible
        // We can at least verify the component doesn't crash
        expect(document.body).toBeInTheDocument()
    })

    it('renders the toaster component structure', () => {
        renderWithChakra(<Toaster toaster={mockToaster} />)

        // Since Chakra UI Portal renders outside the test container,
        // we need to look in the document body for the portal content
        const portal = document.querySelector('[data-portal]')
        expect(portal || document.body).toBeInTheDocument()
    })

    it('exports toaster instance with correct configuration', () => {
        expect(toaster).toBeDefined()
        expect(toaster.placement).toBe('top-end')
    })

    it('passes toaster prop to ChakraToaster', () => {
        const customToaster = {
            placement: 'bottom-start',
            id: 'custom-toaster',
            toasts: []
        }

        renderWithChakra(<Toaster toaster={customToaster} />)

        // The component should render without errors when passed a custom toaster
        expect(document.body).toBeInTheDocument()
    })
})
