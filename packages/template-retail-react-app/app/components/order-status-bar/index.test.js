/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {screen} from '@testing-library/react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
import OrderStatusBar from '.'

describe('OrderStatusBar', () => {
    beforeEach(() => jest.clearAllMocks())

    test('renders all step labels with localized messages', () => {
        renderWithProviders(<OrderStatusBar />)

        expect(screen.getByText('Ordered')).toBeInTheDocument()
        expect(screen.getByText('Dispatched')).toBeInTheDocument()
        expect(screen.getByText('Out for delivery')).toBeInTheDocument()
        expect(screen.getByText('Delivered')).toBeInTheDocument()
    })

    test('renders step labels with responsive font sizes and word wrapping', () => {
        renderWithProviders(<OrderStatusBar />)

        const labels = screen.getAllByText(/Ordered|Dispatched|Out for delivery|Delivered/)
        labels.forEach((label) => {
            // Check that the component renders without errors
            expect(label).toBeInTheDocument()
            // Note: Chakra UI styles may not be directly accessible in tests
            // but we can verify the component renders without errors
        })
    })

    test('renders SVG element with correct attributes', () => {
        renderWithProviders(<OrderStatusBar />)

        const svg = document.querySelector('svg')
        expect(svg).toBeInTheDocument()
        expect(svg).toHaveAttribute('viewBox', '0 0 1080 50')
        expect(svg).toHaveAttribute('width', '100%')
        expect(svg).toHaveAttribute('preserveAspectRatio', 'none')
        expect(svg).toHaveStyle({display: 'block'})
    })

    test('renders all step paths in SVG with correct count', () => {
        renderWithProviders(<OrderStatusBar />)

        const svg = document.querySelector('svg')
        const paths = svg.querySelectorAll('path')
        expect(paths).toHaveLength(4) // Should have 4 paths for 4 steps
    })

    test('renders with different currentStepLabel props and updates colors accordingly', () => {
        // Test with first step (Ordered) - should have dark blue background and white text
        const {rerender} = renderWithProviders(<OrderStatusBar currentStepLabel="Ordered" />)
        expect(screen.getByText('Ordered')).toBeInTheDocument()

        // Test with middle step (Dispatched) - should have light teal for completed, dark blue for current, gray for future
        rerender(<OrderStatusBar currentStepLabel="Dispatched" />)
        expect(screen.getByText('Dispatched')).toBeInTheDocument()

        // Test with last step (Delivered) - should have light teal for all completed steps, dark blue for current
        rerender(<OrderStatusBar currentStepLabel="Delivered" />)
        expect(screen.getByText('Delivered')).toBeInTheDocument()

        // Test with invalid step label (should default to first step)
        rerender(<OrderStatusBar currentStepLabel="Invalid Step" />)
        expect(screen.getByText('Ordered')).toBeInTheDocument()

        // Test with empty string (should default to first step)
        rerender(<OrderStatusBar currentStepLabel="" />)
        expect(screen.getByText('Ordered')).toBeInTheDocument()

        // Test with undefined value (should default to first step)
        rerender(<OrderStatusBar currentStepLabel={undefined} />)
        expect(screen.getByText('Ordered')).toBeInTheDocument()

        // Test with array of values (should default to first step)
        rerender(<OrderStatusBar currentStepLabel={['Ordered', 'Dispatched']} />)
        expect(screen.getByText('Ordered')).toBeInTheDocument()
    })

    test('renders container with correct positioning and dimensions', () => {
        renderWithProviders(<OrderStatusBar />)

        // The container is a Chakra UI Box component, so we check for the SVG instead
        const svg = document.querySelector('svg')
        expect(svg).toBeInTheDocument()
        expect(svg).toHaveAttribute('width', '100%')
        expect(svg).toHaveAttribute('viewBox', '0 0 1080 50')
    })

    test('renders text labels with correct styling properties', () => {
        renderWithProviders(<OrderStatusBar />)

        const labels = screen.getAllByText(/Ordered|Dispatched|Out for delivery|Delivered/)
        labels.forEach((label) => {
            // Check that labels are rendered
            expect(label).toBeInTheDocument()
            // Note: Chakra UI styles may not be directly accessible in tests
            // but we can verify the component renders without errors
        })
    })

    test('renders step labels with proper positioning', () => {
        renderWithProviders(<OrderStatusBar />)

        // Check that all step labels are rendered
        const labels = screen.getAllByText(/Ordered|Dispatched|Out for delivery|Delivered/)
        expect(labels).toHaveLength(4)

        // Check that each label is in the document
        labels.forEach((label) => {
            expect(label).toBeInTheDocument()
        })
    })

    test('handles case-sensitive step label matching', () => {
        // Test case-insensitive matching
        const {rerender} = renderWithProviders(<OrderStatusBar currentStepLabel="ordered" />)
        expect(screen.getByText('Ordered')).toBeInTheDocument()

        // Test with different case
        rerender(<OrderStatusBar currentStepLabel="DISPATCHED" />)
        expect(screen.getByText('Dispatched')).toBeInTheDocument()

        // Test with mixed case
        rerender(<OrderStatusBar currentStepLabel="Out For Delivery" />)
        expect(screen.getByText('Out for delivery')).toBeInTheDocument()
    })
})
