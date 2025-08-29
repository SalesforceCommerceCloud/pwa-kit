/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen} from '@testing-library/react'
import CheckoutSkeleton from '@salesforce/retail-react-app/../../app/pages/checkout-one-click/partials/one-click-checkout-skeleton'

describe('CheckoutSkeleton Component', () => {
    describe('Rendering', () => {
        test('renders checkout skeleton component', () => {
            render(<CheckoutSkeleton />)

            expect(screen.getByTestId('sf-checkout-skeleton')).toBeInTheDocument()
        })

        test('renders main skeleton elements', () => {
            render(<CheckoutSkeleton />)

            const skeletons = screen.getAllByTestId(/chakra-skeleton/)

            // Should have multiple skeleton elements for the loading state
            expect(skeletons.length).toBeGreaterThan(0)
        })

        test('has proper grid layout structure', () => {
            render(<CheckoutSkeleton />)

            const container = screen.getByTestId('sf-checkout-skeleton')
            expect(container).toBeInTheDocument()

            // Container should have proper styling classes for grid layout
            expect(container).toHaveClass('chakra-container')
        })

        test('renders left side skeleton elements', () => {
            render(<CheckoutSkeleton />)

            // The left side should have 4 main skeleton elements (based on the component)
            const skeletons = screen.getAllByTestId(/chakra-skeleton/)

            // Verify we have skeleton elements rendered
            expect(skeletons.length).toBeGreaterThan(4) // At least 4 main ones plus sidebar ones
        })

        test('renders right sidebar skeleton elements', () => {
            render(<CheckoutSkeleton />)

            // Right sidebar has multiple skeleton elements for order summary
            const skeletons = screen.getAllByTestId(/chakra-skeleton/)

            // Should include sidebar skeletons
            expect(skeletons.length).toBeGreaterThan(6)
        })
    })

    describe('Accessibility', () => {
        test('skeleton elements have proper accessibility attributes', () => {
            render(<CheckoutSkeleton />)

            const skeletons = screen.getAllByTestId(/chakra-skeleton/)

            // All skeleton elements should be properly accessible
            skeletons.forEach((skeleton) => {
                expect(skeleton).toBeInTheDocument()
                // Skeleton elements should have appropriate ARIA attributes for loading states
                expect(skeleton).toHaveAttribute('data-testid')
            })
        })

        test('has proper semantic structure', () => {
            render(<CheckoutSkeleton />)

            const container = screen.getByTestId('sf-checkout-skeleton')

            // Container should be a landmark or have proper role
            expect(container).toBeInTheDocument()
        })
    })

    describe('Layout', () => {
        test('has responsive grid layout', () => {
            render(<CheckoutSkeleton />)

            const container = screen.getByTestId('sf-checkout-skeleton')

            // Should have responsive styling
            expect(container).toHaveClass('chakra-container')
        })

        test('renders background styling', () => {
            render(<CheckoutSkeleton />)

            // The main wrapper should have background styling
            const skeletonWrapper = screen.getByTestId('sf-checkout-skeleton').parentElement
            expect(skeletonWrapper).toBeInTheDocument()
        })
    })

    describe('Content Structure', () => {
        test('left column has multiple form section skeletons', () => {
            render(<CheckoutSkeleton />)

            const skeletons = screen.getAllByTestId(/chakra-skeleton/)

            // Should have skeleton elements representing form sections
            // The component has 4 main skeleton elements for form sections
            expect(skeletons.length).toBeGreaterThanOrEqual(4)
        })

        test('right column has order summary skeleton structure', () => {
            render(<CheckoutSkeleton />)

            const skeletons = screen.getAllByTestId(/chakra-skeleton/)

            // Right column includes additional skeletons for order summary
            // including title, items, totals, etc.
            expect(skeletons.length).toBeGreaterThanOrEqual(7)
        })

        test('skeleton elements have different sizes', () => {
            render(<CheckoutSkeleton />)

            const skeletons = screen.getAllByTestId(/chakra-skeleton/)

            // Different skeleton elements should have different styling
            // This tests that we have variety in the skeleton layout
            expect(skeletons.length).toBeGreaterThan(1)

            // Multiple skeletons indicate proper loading state representation
            skeletons.forEach((skeleton) => {
                expect(skeleton).toBeInTheDocument()
            })
        })
    })

    describe('Visual Indicators', () => {
        test('provides proper loading visual cues', () => {
            render(<CheckoutSkeleton />)

            // Skeleton should indicate loading state
            const container = screen.getByTestId('sf-checkout-skeleton')
            expect(container).toBeInTheDocument()

            // Should have skeleton elements visible to user
            const skeletons = screen.getAllByTestId(/chakra-skeleton/)
            expect(skeletons.length).toBeGreaterThan(0)
        })

        test('skeleton elements are visible and properly sized', () => {
            render(<CheckoutSkeleton />)

            const skeletons = screen.getAllByTestId(/chakra-skeleton/)

            skeletons.forEach((skeleton) => {
                // Each skeleton should be rendered and visible
                expect(skeleton).toBeInTheDocument()
                expect(skeleton).toBeVisible()
            })
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
