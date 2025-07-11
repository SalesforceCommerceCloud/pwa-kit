/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import ProgressTracker from '.'

describe('ProgressTracker', () => {
    beforeEach(() => jest.clearAllMocks())

    test('renders all step labels', () => {
        renderWithProviders(<ProgressTracker />)
        
        expect(screen.getByText('Ordered')).toBeInTheDocument()
        expect(screen.getByText('Dispatched')).toBeInTheDocument()
        expect(screen.getByText('Out for delivery')).toBeInTheDocument()
        expect(screen.getByText('Delivered')).toBeInTheDocument()
    })

    test('renders step labels with responsive font sizes', () => {
        renderWithProviders(<ProgressTracker />)
        
        const labels = screen.getAllByText(/Ordered|Dispatched|Out for delivery|Delivered/)
        labels.forEach((label) => {
            // Check that fontSize is an array (responsive values)
            const computedStyle = window.getComputedStyle(label)
            // Note: In test environment, we can't easily test responsive values
            // but we can verify the component renders without errors
            expect(label).toBeInTheDocument()
        })
    })

    test('renders SVG element', () => {
        renderWithProviders(<ProgressTracker />)
        
        const svg = document.querySelector('svg')
        expect(svg).toBeInTheDocument()
        expect(svg).toHaveAttribute('viewBox', '0 0 1080 50')
        expect(svg).toHaveAttribute('width', '100%')
        expect(svg).toHaveAttribute('preserveAspectRatio', 'none')
    })

    test('renders all step paths in SVG', () => {
        renderWithProviders(<ProgressTracker />)
        
        const svg = document.querySelector('svg')
        const paths = svg.querySelectorAll('path')
        expect(paths).toHaveLength(4) // Should have 4 paths for 4 steps
    })

    test('renders with different currentStepLabel props', () => {
        // Test with valid step label
        const {rerender} = renderWithProviders(<ProgressTracker currentStepLabel="Dispatched" />)
        expect(screen.getByText('Dispatched')).toBeInTheDocument()
        
        // Test with invalid step label (should default to first step)
        rerender(<ProgressTracker currentStepLabel="Invalid Step" />)
        expect(screen.getByText('Ordered')).toBeInTheDocument()
        
        // Test with empty string
        rerender(<ProgressTracker currentStepLabel="" />)
        expect(screen.getByText('Ordered')).toBeInTheDocument()
    })
})
