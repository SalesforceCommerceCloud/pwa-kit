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
import {ChakraProvider, createSystem, defaultConfig, createToaster} from '@chakra-ui/react'
import Toaster, {toaster} from './index'

const TestWrapper = ({children}) => {
    const system = createSystem(defaultConfig)
    return <ChakraProvider value={system}>{children}</ChakraProvider>
}

const renderWithChakra = (component) => {
    return render(component, {wrapper: TestWrapper})
}

describe('Toaster Tests', () => {
    // Use actual createToaster instead of mock objects
    const testToaster = createToaster({
        placement: 'bottom-start'
    })

    it('renders without crashing', () => {
        renderWithChakra(<Toaster toaster={toaster} />)
        expect(document.body).toBeInTheDocument()
    })

    it('renders with custom toaster', () => {
        renderWithChakra(<Toaster toaster={testToaster} />)
        expect(document.body).toBeInTheDocument()
    })

    it('exports toaster instance', () => {
        expect(toaster).toBeDefined()
        expect(typeof toaster).toBe('object')
        // Check for toaster methods instead of placement property
        expect(typeof toaster.create).toBe('function')
        expect(typeof toaster.dismiss).toBe('function')
        expect(typeof toaster.update).toBe('function')
    })

    it('toaster can create toasts', () => {
        // Test that the exported toaster has the expected API
        expect(() => {
            toaster.create({
                title: 'Test Toast',
                description: 'This is a test'
            })
        }).not.toThrow()
    })
})
