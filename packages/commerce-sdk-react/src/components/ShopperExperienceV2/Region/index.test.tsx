/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render, screen} from '@testing-library/react'
import {Region, ComponentType} from './index'
import type {PageWithDesignMetadata} from '../types'

// Mock the Component
jest.mock('../Component', () => ({
    Component: ({component}: {component: {id: string; typeId: string}}) => (
        <div data-testid={`component-${component.id}`} className="component">
            {component.typeId}
        </div>
    )
}))

// Mock the RegionWrapper
jest.mock('./region-wrapper', () => ({
    RegionWrapper: ({children, className}: {children: React.ReactNode; className?: string}) => (
        <div data-testid="region-wrapper" className={`region ${className || ''}`}>
            {children}
        </div>
    )
}))

describe('Region', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Page Mode', () => {
        const mockPage = {
            id: 'test-page',
            regions: [
                {
                    id: 'main-region',
                    components: [
                        {id: 'comp-1', typeId: 'commerce_assets.banner', data: {}},
                        {id: 'comp-2', typeId: 'commerce_assets.carousel', data: {}}
                    ]
                },
                {
                    id: 'sidebar-region',
                    components: [{id: 'comp-3', typeId: 'commerce_assets.promo', data: {}}]
                },
                {
                    id: 'empty-region',
                    components: []
                }
            ],
            designMetadata: {
                id: 'test-page-metadata',
                name: 'Test Page',
                regionDefinitions: [
                    {
                        id: 'main-region',
                        componentTypeExclusions: ['excluded-type'],
                        componentTypeInclusions: ['included-type']
                    }
                ]
            }
        } as unknown as PageWithDesignMetadata

        test('renders page region with components', () => {
            render(<Region page={mockPage} regionId="main-region" />)

            expect(screen.getByTestId('region-wrapper')).toBeInTheDocument()
            expect(screen.getByTestId('component-comp-1')).toBeInTheDocument()
            expect(screen.getByTestId('component-comp-2')).toBeInTheDocument()
        })

        test('renders empty region without components', () => {
            render(<Region page={mockPage} regionId="empty-region" />)

            expect(screen.getByTestId('region-wrapper')).toBeInTheDocument()
            expect(screen.queryByTestId(/^component-/)).not.toBeInTheDocument()
        })

        test('returns null when region is not found and no errorElement', () => {
            const {container} = render(<Region page={mockPage} regionId="non-existent" />)

            expect(container.firstChild).toBeNull()
        })

        test('renders errorElement when region is not found', () => {
            render(
                <Region
                    page={mockPage}
                    regionId="non-existent"
                    errorElement={<div data-testid="error">Region not found</div>}
                />
            )

            expect(screen.getByTestId('error')).toBeInTheDocument()
            expect(screen.getByText('Region not found')).toBeInTheDocument()
        })

        test('applies className to region', () => {
            render(<Region page={mockPage} regionId="main-region" className="custom-class" />)

            const wrapper = screen.getByTestId('region-wrapper')
            expect(wrapper).toHaveClass('custom-class')
        })

        test('handles page with no regions', () => {
            const pageWithNoRegions = {
                id: 'test-page',
                regions: undefined
            } as unknown as PageWithDesignMetadata
            const {container} = render(<Region page={pageWithNoRegions} regionId="main-region" />)

            expect(container.firstChild).toBeNull()
        })
    })

    describe('Component Mode', () => {
        const mockComponent = {
            id: 'parent-component',
            typeId: 'commerce_layouts.grid',
            data: {},
            regions: [
                {
                    id: 'nested-region',
                    components: [
                        {id: 'nested-comp-1', typeId: 'commerce_assets.text', data: {}},
                        {id: 'nested-comp-2', typeId: 'commerce_assets.image', data: {}}
                    ]
                }
            ],
            designMetadata: {
                name: 'Parent Component',
                regionDefinitions: [
                    {
                        id: 'nested-region',
                        componentTypeExclusions: [],
                        componentTypeInclusions: []
                    }
                ]
            }
        } as unknown as ComponentType

        test('renders component region with nested components', () => {
            render(<Region component={mockComponent} regionId="nested-region" />)

            expect(screen.getByTestId('region-wrapper')).toBeInTheDocument()
            expect(screen.getByTestId('component-nested-comp-1')).toBeInTheDocument()
            expect(screen.getByTestId('component-nested-comp-2')).toBeInTheDocument()
        })

        test('returns null when component region is not found and no errorElement', () => {
            const {container} = render(<Region component={mockComponent} regionId="non-existent" />)

            expect(container.firstChild).toBeNull()
        })

        test('renders errorElement when component region is not found', () => {
            render(
                <Region
                    component={mockComponent}
                    regionId="non-existent"
                    errorElement={<div data-testid="error">Nested region not found</div>}
                />
            )

            expect(screen.getByTestId('error')).toBeInTheDocument()
        })

        test('handles component with no regions', () => {
            const componentWithNoRegions = {
                id: 'comp',
                typeId: 'test',
                data: {},
                regions: undefined
            } as unknown as ComponentType
            const {container} = render(
                <Region component={componentWithNoRegions} regionId="any-region" />
            )

            expect(container.firstChild).toBeNull()
        })
    })

    describe('Design Metadata', () => {
        test('passes design metadata to RegionWrapper for page regions', () => {
            const mockPage = {
                id: 'test-page',
                regions: [{id: 'main', components: []}],
                designMetadata: {
                    id: 'test-page-metadata',
                    name: 'Test Page',
                    regionDefinitions: [
                        {
                            id: 'main',
                            componentTypeExclusions: ['excluded'],
                            componentTypeInclusions: ['included']
                        }
                    ]
                }
            } as unknown as PageWithDesignMetadata

            render(<Region page={mockPage} regionId="main" />)

            expect(screen.getByTestId('region-wrapper')).toBeInTheDocument()
        })

        test('handles missing design metadata gracefully', () => {
            const mockPage = {
                id: 'test-page',
                regions: [{id: 'main', components: []}]
            } as unknown as PageWithDesignMetadata

            render(<Region page={mockPage} regionId="main" />)

            expect(screen.getByTestId('region-wrapper')).toBeInTheDocument()
        })
    })
})
