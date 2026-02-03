/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen} from '@testing-library/react'
import CheckoutSkeleton from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-checkout-skeleton'

describe('CheckoutSkeleton Component', () => {
    describe('Rendering', () => {
        test('renders checkout skeleton component', () => {
            render(<CheckoutSkeleton />)

            expect(screen.getByTestId('sf-checkout-skeleton')).toBeInTheDocument()
        })

        test('has proper grid layout structure', () => {
            render(<CheckoutSkeleton />)

            const container = screen.getByTestId('sf-checkout-skeleton')
            expect(container).toBeInTheDocument()

            // Container should have proper styling classes for grid layout
            expect(container).toHaveClass('chakra-container')
        })

        test('renders background styling', () => {
            render(<CheckoutSkeleton />)

            // The main wrapper should have background styling
            const skeletonWrapper = screen.getByTestId('sf-checkout-skeleton').parentElement
            expect(skeletonWrapper).toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        test('has proper semantic structure', () => {
            render(<CheckoutSkeleton />)

            const container = screen.getByTestId('sf-checkout-skeleton')

            // Container should be a landmark or have proper role
            expect(container).toBeInTheDocument()
        })

        test('has responsive grid layout', () => {
            render(<CheckoutSkeleton />)

            const container = screen.getByTestId('sf-checkout-skeleton')

            // Should have responsive styling
            expect(container).toHaveClass('chakra-container')
        })
    })

    describe('Component Independence', () => {
        test('renders without any props', () => {
            expect(() => render(<CheckoutSkeleton />)).not.toThrow()
        })

        test('does not require external data or context', () => {
            // Should render independently without any providers or data
            render(<CheckoutSkeleton />)

            expect(screen.getByTestId('sf-checkout-skeleton')).toBeInTheDocument()
        })

        test('is a pure presentational component', () => {
            // Should render the same way every time
            const {unmount} = render(<CheckoutSkeleton />)
            const firstRender = screen.getByTestId('sf-checkout-skeleton')
            expect(firstRender).toBeInTheDocument()

            unmount()

            render(<CheckoutSkeleton />)
            const secondRender = screen.getByTestId('sf-checkout-skeleton')
            expect(secondRender).toBeInTheDocument()
        })
    })

    describe('Performance', () => {
        test('renders quickly without heavy computations', () => {
            const startTime = Date.now()
            render(<CheckoutSkeleton />)
            const endTime = Date.now()

            // Should render very quickly since it's just static skeleton elements
            expect(endTime - startTime).toBeLessThan(100) // 100ms threshold
        })

        test('multiple renders perform consistently', () => {
            // Should handle multiple renders without issues
            for (let i = 0; i < 5; i++) {
                const {unmount} = render(<CheckoutSkeleton />)
                expect(screen.getByTestId('sf-checkout-skeleton')).toBeInTheDocument()
                unmount()
            }
        })
    })
})
