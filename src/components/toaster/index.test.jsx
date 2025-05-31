/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable react/prop-types */
import React from 'react'
import {render, waitFor, screen, within} from '@testing-library/react'
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
    const testToaster = createToaster({
        placement: 'bottom-start'
    })

    it('renders toast group container', () => {
        renderWithChakra(<Toaster toaster={toaster} />)
        
        const toastGroup = document.querySelector('[data-scope="toast"]')
        expect(toastGroup).toBeInTheDocument()
    })

    it('renders toast group with correct placement', () => {
        renderWithChakra(<Toaster toaster={toaster} />)
        const toastGroup = document.querySelector('[data-placement="top-end"]')
        expect(toastGroup).toBeInTheDocument()
    })

    it('renders with custom toaster placement', () => {
        renderWithChakra(<Toaster toaster={testToaster} />)
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
        renderWithChakra(<Toaster toaster={toaster} />)

        console.log('Before create - DOM:', document.body.innerHTML)
        
        const toastId = toaster.create({
            title: 'Test Toast',
            description: 'This is a test description'
        })
        
        console.log('Toast ID returned:', toastId)
        console.log('After create - DOM:', document.body.innerHTML)
        
        // Let's wait a bit and check again
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log('After timeout - DOM:', document.body.innerHTML)

        await waitFor(() => {
            expect(within(document.body).getByText('Test Toast')).toBeInTheDocument()
        }, { timeout: 5000 })
        
        expect(within(document.body).getByText('This is a test description')).toBeInTheDocument()
    })

    it('renders toast with action when provided', async () => {
        renderWithChakra(<Toaster toaster={toaster} />)
        
        toaster.create({
            title: 'Action Toast',
            action: {
                label: 'Click me'
            }
        })
        
        await waitFor(() => {
            expect(document.body).toHaveTextContent('Action Toast')
        })
        
        expect(document.body).toHaveTextContent('Click me')
    })

    it('can create and render a toast - alternative approach', async () => {
        let contextToaster
        
        const TestComponent = () => {
            // Create toaster inside the component
            contextToaster = createToaster({
                placement: 'top-end'
            })
            
            return <Toaster toaster={contextToaster} />
        }
        
        renderWithChakra(<TestComponent />)

        // Use the toaster created inside the context
        contextToaster.create({
            title: 'Context Test Toast',
            description: 'This is a context test description'
        })

        await waitFor(() => {
            expect(within(document.body).getByText('Context Test Toast')).toBeInTheDocument()
        })
        
        expect(within(document.body).getByText('This is a context test description')).toBeInTheDocument()
    })
})
