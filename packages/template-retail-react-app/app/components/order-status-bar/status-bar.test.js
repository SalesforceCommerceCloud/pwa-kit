/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen} from '@testing-library/react'
import {IntlProvider} from 'react-intl'
import {ChakraProvider} from '@chakra-ui/react'
import StatusBar from '@salesforce/retail-react-app/app/components/order-status-bar/status-bar'

const renderWithProviders = (component) => {
    return render(
        <IntlProvider locale="en">
            <ChakraProvider>{component}</ChakraProvider>
        </IntlProvider>
    )
}

describe('StatusBar Component', () => {
    const mockSteps = [
        {label: 'Step 1', status: 'completed', description: 'First step completed'},
        {label: 'Step 2', status: 'current', description: 'Currently working on this'},
        {label: 'Step 3', status: 'future', description: 'Next step'},
        {label: 'Step 4', status: 'future', description: 'Final step'}
    ]

    const defaultColors = {
        completed: '#e6fffa',
        current: '#1a365d',
        future: '#e2e8f0',
        completedText: '#2d3748',
        currentText: 'white',
        futureText: '#718096'
    }

    test('renders status bar with steps', () => {
        renderWithProviders(<StatusBar steps={mockSteps} currentStep={1} colors={defaultColors} />)

        expect(screen.getByRole('tablist')).toBeInTheDocument()
        expect(screen.getByText('Step 1')).toBeInTheDocument()
        expect(screen.getByText('Step 2')).toBeInTheDocument()
        expect(screen.getByText('Step 3')).toBeInTheDocument()
        expect(screen.getByText('Step 4')).toBeInTheDocument()
    })

    test('renders with custom colors', () => {
        const customColors = {
            completed: '#90EE90',
            current: '#FF6B6B',
            future: '#F0F0F0',
            completedText: '#000000',
            currentText: '#FFFFFF',
            futureText: '#666666'
        }

        renderWithProviders(<StatusBar steps={mockSteps} currentStep={1} colors={customColors} />)

        expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    test('renders without labels when showLabels is false', () => {
        renderWithProviders(
            <StatusBar
                steps={mockSteps}
                currentStep={1}
                showLabels={false}
                colors={defaultColors}
            />
        )

        expect(screen.getByRole('tablist')).toBeInTheDocument()
        expect(screen.queryByText('Step 1')).not.toBeInTheDocument()
        expect(screen.queryByText('Step 2')).not.toBeInTheDocument()
    })

    test('renders with custom dimensions', () => {
        renderWithProviders(
            <StatusBar
                steps={mockSteps}
                currentStep={1}
                colors={defaultColors}
                width={1000}
                height={80}
                chevronWidth={30}
                radius={20}
            />
        )

        expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    test('renders with custom aria label', () => {
        const customAriaLabel = 'Custom progress tracker'
        renderWithProviders(
            <StatusBar
                steps={mockSteps}
                currentStep={1}
                ariaLabel={customAriaLabel}
                colors={defaultColors}
            />
        )

        const tablist = screen.getByRole('tablist')
        expect(tablist).toHaveAttribute('aria-label', customAriaLabel)
    })

    test('renders null when no steps provided', () => {
        const {container} = renderWithProviders(<StatusBar steps={[]} colors={defaultColors} />)
        // Check that only the Chakra environment span is rendered
        const chakraSpan = container.querySelector('#__chakra_env')
        expect(chakraSpan).toBeInTheDocument()
        // The StatusBar component should not render anything
        expect(container.querySelector('[role="tablist"]')).not.toBeInTheDocument()
    })

    test('renders null when steps is null', () => {
        const {container} = renderWithProviders(<StatusBar steps={null} colors={defaultColors} />)
        // Check that only the Chakra environment span is rendered
        const chakraSpan = container.querySelector('#__chakra_env')
        expect(chakraSpan).toBeInTheDocument()
        // The StatusBar component should not render anything
        expect(container.querySelector('[role="tablist"]')).not.toBeInTheDocument()
    })

    test('renders null when steps is undefined', () => {
        const {container} = renderWithProviders(
            <StatusBar steps={undefined} colors={defaultColors} />
        )
        // Check that only the Chakra environment span is rendered
        const chakraSpan = container.querySelector('#__chakra_env')
        expect(chakraSpan).toBeInTheDocument()
        // The StatusBar component should not render anything
        expect(container.querySelector('[role="tablist"]')).not.toBeInTheDocument()
    })

    test('handles single step', () => {
        const singleStep = [{label: 'Single Step', status: 'current', description: 'Only one step'}]
        renderWithProviders(<StatusBar steps={singleStep} currentStep={0} colors={defaultColors} />)

        expect(screen.getByRole('tablist')).toBeInTheDocument()
        expect(screen.getByText('Single Step')).toBeInTheDocument()
    })

    test('handles steps without labels', () => {
        const stepsWithoutLabels = [
            {status: 'completed', description: 'Step 1'},
            {status: 'current', description: 'Step 2'},
            {status: 'future', description: 'Step 3'}
        ]

        renderWithProviders(
            <StatusBar steps={stepsWithoutLabels} currentStep={1} colors={defaultColors} />
        )
        expect(screen.getByRole('tablist')).toBeInTheDocument()
        expect(screen.getByText('Step 1')).toBeInTheDocument()
        expect(screen.getByText('Step 2')).toBeInTheDocument()
        expect(screen.getByText('Step 3')).toBeInTheDocument()
    })

    test('has correct accessibility attributes', () => {
        renderWithProviders(<StatusBar steps={mockSteps} currentStep={1} colors={defaultColors} />)

        const tablist = screen.getByRole('tablist')
        expect(tablist).toHaveAttribute('aria-describedby', 'status-bar-description')

        const tabs = screen.getAllByRole('tab')
        expect(tabs).toHaveLength(4)

        // Check that current step is selected
        expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
        expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
        expect(tabs[2]).toHaveAttribute('aria-selected', 'false')
        expect(tabs[3]).toHaveAttribute('aria-selected', 'false')
    })

    test('renders SVG with correct attributes', () => {
        renderWithProviders(
            <StatusBar
                steps={mockSteps}
                currentStep={1}
                colors={defaultColors}
                width={1080}
                height={50}
            />
        )

        const svg = document.querySelector('svg')
        expect(svg).toBeInTheDocument()
        expect(svg).toHaveAttribute('viewBox', '0 0 1080 50')
        expect(svg).toHaveAttribute('width', '100%')
        expect(svg).toHaveAttribute('preserveAspectRatio', 'none')
        expect(svg).toHaveStyle({display: 'block'})
        expect(svg).toHaveAttribute('aria-hidden', 'true')
    })

    test('renders correct number of SVG paths', () => {
        renderWithProviders(<StatusBar steps={mockSteps} currentStep={1} colors={defaultColors} />)

        const svg = document.querySelector('svg')
        const paths = svg.querySelectorAll('path')
        expect(paths).toHaveLength(4) // Should have 4 paths for 4 steps
    })

    test('handles currentStep at beginning', () => {
        renderWithProviders(<StatusBar steps={mockSteps} currentStep={0} colors={defaultColors} />)
        expect(screen.getByRole('tablist')).toBeInTheDocument()

        const tabs = screen.getAllByRole('tab')
        expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    })

    test('handles currentStep at end', () => {
        renderWithProviders(<StatusBar steps={mockSteps} currentStep={3} colors={defaultColors} />)
        expect(screen.getByRole('tablist')).toBeInTheDocument()

        const tabs = screen.getAllByRole('tab')
        expect(tabs[3]).toHaveAttribute('aria-selected', 'true')
    })

    test('handles currentStep beyond steps length', () => {
        renderWithProviders(<StatusBar steps={mockSteps} currentStep={10} colors={defaultColors} />)
        expect(screen.getByRole('tablist')).toBeInTheDocument()

        const tabs = screen.getAllByRole('tab')
        // With currentStep=10, no step should be selected (all will be future steps)
        expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
        expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
        expect(tabs[2]).toHaveAttribute('aria-selected', 'false')
        expect(tabs[3]).toHaveAttribute('aria-selected', 'false')
    })

    test('handles negative currentStep', () => {
        renderWithProviders(<StatusBar steps={mockSteps} currentStep={-1} colors={defaultColors} />)
        expect(screen.getByRole('tablist')).toBeInTheDocument()

        const tabs = screen.getAllByRole('tab')
        // With currentStep=-1, no step should be selected (all will be future steps)
        expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
        expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
        expect(tabs[2]).toHaveAttribute('aria-selected', 'false')
        expect(tabs[3]).toHaveAttribute('aria-selected', 'false')
    })

    test('renders with custom width and height', () => {
        renderWithProviders(
            <StatusBar
                steps={mockSteps}
                currentStep={1}
                width={800}
                height={60}
                colors={defaultColors}
            />
        )

        const svg = document.querySelector('svg')
        expect(svg).toHaveAttribute('viewBox', '0 0 800 60')
    })
})
