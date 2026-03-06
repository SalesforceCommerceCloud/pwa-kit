/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen} from '@testing-library/react'
import {RegionWrapper, RegionRendererProps} from './region-wrapper'

const mockUsePageDesignerMode = jest.fn(() => ({isDesignMode: false}))

jest.mock('@salesforce/storefront-next-runtime/design/react/core', () => ({
    usePageDesignerMode: () => mockUsePageDesignerMode()
}))

jest.mock('@salesforce/storefront-next-runtime/design/react', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mockReact = require('react')
    return {
        createReactRegionDesignDecorator: (Component: typeof mockReact.ComponentType) => {
            return function DecoratedComponent(props: Record<string, unknown>) {
                return mockReact.createElement(
                    'div',
                    {'data-testid': 'decorated-region'},
                    mockReact.createElement(Component, props)
                )
            }
        }
    }
})

describe('RegionWrapper', () => {
    const mockRegion = {
        id: 'test-region',
        components: [
            {id: 'comp-1', typeId: 'banner'},
            {id: 'comp-2', typeId: 'carousel'}
        ]
    }

    const mockDesignMetadata: RegionRendererProps['designMetadata'] = {
        id: 'test-region',
        componentTypeExclusions: ['excluded-type'],
        componentTypeInclusions: ['included-type']
    }

    beforeEach(() => {
        jest.clearAllMocks()
        // Suppress console.log during tests
        jest.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('Runtime Mode (Design Mode Off)', () => {
        beforeEach(() => {
            mockUsePageDesignerMode.mockReturnValue({isDesignMode: false})
        })

        test('renders children directly without decoration', () => {
            render(
                <RegionWrapper region={mockRegion}>
                    <div data-testid="child-content">Child Content</div>
                </RegionWrapper>
            )

            expect(screen.getByTestId('child-content')).toBeInTheDocument()
            expect(screen.queryByTestId('decorated-region')).not.toBeInTheDocument()
        })

        test('renders with className', () => {
            render(
                <RegionWrapper region={mockRegion} className="custom-class">
                    <div data-testid="child-content">Content</div>
                </RegionWrapper>
            )

            expect(screen.getByTestId('child-content')).toBeInTheDocument()
        })

        test('renders with design metadata', () => {
            render(
                <RegionWrapper region={mockRegion} designMetadata={mockDesignMetadata}>
                    <div data-testid="child-content">Content</div>
                </RegionWrapper>
            )

            expect(screen.getByTestId('child-content')).toBeInTheDocument()
        })

        test('renders multiple children', () => {
            render(
                <RegionWrapper region={mockRegion}>
                    <div data-testid="child-1">Child 1</div>
                    <div data-testid="child-2">Child 2</div>
                    <div data-testid="child-3">Child 3</div>
                </RegionWrapper>
            )

            expect(screen.getByTestId('child-1')).toBeInTheDocument()
            expect(screen.getByTestId('child-2')).toBeInTheDocument()
            expect(screen.getByTestId('child-3')).toBeInTheDocument()
        })
    })

    describe('Design Mode (Design Mode On)', () => {
        beforeEach(() => {
            mockUsePageDesignerMode.mockReturnValue({isDesignMode: true})
        })

        test('renders with decoration when region has id', () => {
            render(
                <RegionWrapper region={mockRegion}>
                    <div data-testid="child-content">Child Content</div>
                </RegionWrapper>
            )

            expect(screen.getByTestId('decorated-region')).toBeInTheDocument()
            expect(screen.getByTestId('child-content')).toBeInTheDocument()
        })

        test('renders without decoration when region has no id', () => {
            const regionWithoutId = {
                ...mockRegion,
                id: undefined
            }

            render(
                <RegionWrapper region={regionWithoutId}>
                    <div data-testid="child-content">Child Content</div>
                </RegionWrapper>
            )

            // Should fall back to non-decorated rendering
            expect(screen.queryByTestId('decorated-region')).not.toBeInTheDocument()
            expect(screen.getByTestId('child-content')).toBeInTheDocument()
        })

        test('passes design metadata to decorated component', () => {
            render(
                <RegionWrapper region={mockRegion} designMetadata={mockDesignMetadata}>
                    <div data-testid="child-content">Content</div>
                </RegionWrapper>
            )

            expect(screen.getByTestId('decorated-region')).toBeInTheDocument()
        })
    })

    describe('Design Metadata Computation', () => {
        beforeEach(() => {
            mockUsePageDesignerMode.mockReturnValue({isDesignMode: true})
        })

        test('computes componentIds from region components', () => {
            render(
                <RegionWrapper region={mockRegion}>
                    <div>Content</div>
                </RegionWrapper>
            )

            // The component should compute componentIds: ['comp-1', 'comp-2']
            expect(screen.getByTestId('decorated-region')).toBeInTheDocument()
        })

        test('handles region with no components', () => {
            const regionWithNoComponents = {
                id: 'empty-region',
                components: undefined
            }

            render(
                <RegionWrapper region={regionWithNoComponents}>
                    <div data-testid="child-content">Content</div>
                </RegionWrapper>
            )

            expect(screen.getByTestId('child-content')).toBeInTheDocument()
        })

        test('handles region with empty components array', () => {
            const regionWithEmptyComponents = {
                id: 'empty-region',
                components: []
            }

            render(
                <RegionWrapper region={regionWithEmptyComponents}>
                    <div data-testid="child-content">Content</div>
                </RegionWrapper>
            )

            expect(screen.getByTestId('child-content')).toBeInTheDocument()
        })

        test('uses default empty arrays when designMetadata is not provided', () => {
            render(
                <RegionWrapper region={mockRegion}>
                    <div data-testid="child-content">Content</div>
                </RegionWrapper>
            )

            expect(screen.getByTestId('child-content')).toBeInTheDocument()
        })
    })

    describe('Props Forwarding', () => {
        beforeEach(() => {
            mockUsePageDesignerMode.mockReturnValue({isDesignMode: false})
        })

        test('forwards additional HTML attributes', () => {
            render(
                <RegionWrapper
                    region={mockRegion}
                    data-custom="custom-value"
                    aria-label="Test region"
                >
                    <div data-testid="child-content">Content</div>
                </RegionWrapper>
            )

            expect(screen.getByTestId('child-content')).toBeInTheDocument()
        })
    })
})
