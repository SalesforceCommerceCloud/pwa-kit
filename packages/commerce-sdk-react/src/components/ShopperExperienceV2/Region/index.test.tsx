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

type DesignContext = {
    pageUpdateMode?: string
    pageDesignerConfig?: {page?: PageWithDesignMetadata | null} | null
} | null

type RegionContext = {regionId: string; contentLinkUuids: string[]} | null

type RegionWrapperProps = {
    children: React.ReactNode
    className?: string
    region: {id: string; components?: {id: string}[]}
    designMetadata?: {
        id: string
        componentTypeExclusions: string[]
        componentTypeInclusions: string[]
    }
    [key: string]: unknown
}

const mockUseDesignContext = jest.fn<DesignContext, []>(() => null)
const mockUseRegionContext = jest.fn<RegionContext, []>(() => null)
const mockPageDesignerPageMetadataProvider = jest.fn(({page}: {page: unknown}) => {
    void page
    return null
})
const mockRegionWrapper = jest.fn(({children, className}: RegionWrapperProps) => (
    <div data-testid="region-wrapper" className={`region ${className || ''}`}>
        {children}
    </div>
))

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
    RegionWrapper: (props: RegionWrapperProps) => mockRegionWrapper(props)
}))

jest.mock('@salesforce/storefront-next-runtime/design/react/core', () => ({
    PageDesignerPageMetadataProvider: (props: {page: unknown}) =>
        mockPageDesignerPageMetadataProvider(props),
    useRegionContext: () => mockUseRegionContext()
}))

jest.mock('@salesforce/storefront-next-runtime/design/react', () => ({
    useDesignContext: () => mockUseDesignContext()
}))

describe('Region', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseDesignContext.mockReturnValue(null)
        mockUseRegionContext.mockReturnValue(null)
    })

    describe('Page Mode', () => {
        const mockPage = {
            id: 'test-page',
            regions: [
                {
                    id: 'main-region',
                    components: [
                        {
                            id: 'comp-1',
                            typeId: 'commerce_assets.banner',
                            data: {},
                            contentLinkUuid: '0e1f329d4ac66ff2c3bbf70301'
                        },
                        {
                            id: 'comp-2',
                            typeId: 'commerce_assets.carousel',
                            data: {},
                            contentLinkUuid: '1f2g430e5bd77gg3d4ccg80402'
                        }
                    ]
                },
                {
                    id: 'sidebar-region',
                    components: [
                        {
                            id: 'comp-3',
                            typeId: 'commerce_assets.promo',
                            data: {},
                            contentLinkUuid: '2g3h541f6ce88hh4e5ddh91503'
                        }
                    ]
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
                        {
                            id: 'nested-comp-1',
                            typeId: 'commerce_assets.text',
                            data: {},
                            contentLinkUuid: '3h4i652g7df99ii5f6eei02604'
                        },
                        {
                            id: 'nested-comp-2',
                            typeId: 'commerce_assets.image',
                            data: {},
                            contentLinkUuid: '4i5j763h8eg00jj6g7ffj13705'
                        }
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

    describe('Content Link UUID', () => {
        test('handles duplicate fragments with same id but different contentLinkUuid', () => {
            const mockPageWithDuplicates = {
                id: 'test-page',
                regions: [
                    {
                        id: 'main-region',
                        components: [
                            {
                                id: 'hero-fragment', // Same ID
                                typeId: 'commerce_assets.hero',
                                data: {},
                                contentLinkUuid: 'uuid-first-instance-001'
                            },
                            {
                                id: 'hero-fragment', // Same ID (reused fragment)
                                typeId: 'commerce_assets.hero',
                                data: {},
                                contentLinkUuid: 'uuid-second-instance-002'
                            },
                            {
                                id: 'hero-fragment', // Same ID (reused fragment)
                                typeId: 'commerce_assets.hero',
                                data: {},
                                contentLinkUuid: 'uuid-third-instance-003'
                            }
                        ]
                    }
                ]
            } as unknown as PageWithDesignMetadata

            render(<Region page={mockPageWithDuplicates} regionId="main-region" />)

            const components = screen.getAllByTestId(/^component-hero-fragment$/)
            expect(components).toHaveLength(3)
        })

        test('falls back to id when contentLinkUuid is not present', () => {
            // Test backward compatibility
            const mockPageWithoutUuid = {
                id: 'test-page',
                regions: [
                    {
                        id: 'main-region',
                        components: [{id: 'comp-1', typeId: 'commerce_assets.banner', data: {}}]
                    }
                ]
            } as unknown as PageWithDesignMetadata

            render(<Region page={mockPageWithoutUuid} regionId="main-region" />)

            expect(screen.getByTestId('component-comp-1')).toBeInTheDocument()
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
            expect(mockRegionWrapper.mock.calls[0][0].designMetadata).toEqual({
                id: 'main',
                componentTypeExclusions: ['excluded'],
                componentTypeInclusions: ['included']
            })
        })

        test('handles missing design metadata gracefully', () => {
            const mockPage = {
                id: 'test-page',
                regions: [{id: 'main', components: []}]
            } as unknown as PageWithDesignMetadata

            render(<Region page={mockPage} regionId="main" />)

            expect(screen.getByTestId('region-wrapper')).toBeInTheDocument()
            expect(mockRegionWrapper.mock.calls[0][0].designMetadata).toEqual({
                id: 'main',
                componentTypeExclusions: [],
                componentTypeInclusions: []
            })
        })
    })

    describe('Live page selection', () => {
        const createPage = (id: string, componentId: string): PageWithDesignMetadata =>
            ({
                id,
                regions: [
                    {
                        id: 'other-region',
                        components: [{id: `${componentId}-other`, typeId: 'other', data: {}}]
                    },
                    {
                        id: 'main',
                        components: [{id: componentId, typeId: 'banner', data: {}}]
                    }
                ],
                designMetadata: {
                    id: `${id}-metadata`,
                    name: id,
                    regionDefinitions: [
                        {
                            id: 'other-region',
                            componentTypeExclusions: ['other-exclusion'],
                            componentTypeInclusions: ['other-inclusion']
                        },
                        {
                            id: 'main',
                            componentTypeExclusions: [`${id}-excluded`],
                            componentTypeInclusions: [`${id}-included`]
                        }
                    ]
                }
            } as unknown as PageWithDesignMetadata)

        test('renders the client live page and forwards its region metadata and DOM props', () => {
            const originalPage = createPage('original', 'original-component')
            const livePage = createPage('live', 'live-component')
            mockUseDesignContext.mockReturnValue({
                pageUpdateMode: 'client',
                pageDesignerConfig: {page: livePage}
            })

            render(
                <Region
                    page={originalPage}
                    regionId="main"
                    className="custom-class"
                    aria-label="Live region"
                />
            )

            expect(screen.getByTestId('component-live-component')).toBeInTheDocument()
            expect(screen.queryByTestId('component-original-component')).not.toBeInTheDocument()
            expect(mockRegionWrapper.mock.calls[0][0]).toMatchObject({
                region: livePage.regions?.[1],
                designMetadata: {
                    id: 'main',
                    componentTypeExclusions: ['live-excluded'],
                    componentTypeInclusions: ['live-included']
                },
                className: 'custom-class',
                'aria-label': 'Live region'
            })
            expect(mockPageDesignerPageMetadataProvider).toHaveBeenCalledWith({page: livePage})
        })

        test.each(['server', 'absent'] as const)(
            'uses the original page when update mode is %s',
            (mode) => {
                const originalPage = createPage('original', 'original-component')
                const livePage = createPage('live', 'live-component')
                mockUseDesignContext.mockReturnValue(
                    mode === 'absent'
                        ? null
                        : {
                              pageUpdateMode: 'server',
                              pageDesignerConfig: {page: livePage}
                          }
                )

                render(<Region page={originalPage} regionId="main" />)

                expect(screen.getByTestId('component-original-component')).toBeInTheDocument()
                expect(screen.queryByTestId('component-live-component')).not.toBeInTheDocument()
                expect(mockRegionWrapper.mock.calls[0][0].designMetadata).toEqual({
                    id: 'main',
                    componentTypeExclusions: ['original-excluded'],
                    componentTypeInclusions: ['original-included']
                })
                expect(mockPageDesignerPageMetadataProvider).toHaveBeenCalledWith({
                    page: originalPage
                })
            }
        )

        test('uses the original page when update mode is omitted from an available design context', () => {
            const originalPage = createPage('original', 'original-component')
            const livePage = createPage('live', 'live-component')
            mockUseDesignContext.mockReturnValue({
                pageDesignerConfig: {page: livePage}
            })

            render(<Region page={originalPage} regionId="main" />)

            expect(screen.getByTestId('component-original-component')).toBeInTheDocument()
            expect(screen.queryByTestId('component-live-component')).not.toBeInTheDocument()
            expect(mockRegionWrapper.mock.calls[0][0].designMetadata).toEqual({
                id: 'main',
                componentTypeExclusions: ['original-excluded'],
                componentTypeInclusions: ['original-included']
            })
            expect(mockPageDesignerPageMetadataProvider).toHaveBeenCalledWith({
                page: originalPage
            })
        })

        test.each([null, {}, {page: null}])(
            'falls back to the original page when client preview config is %p',
            (pageDesignerConfig) => {
                const originalPage = createPage('original', 'original-component')
                mockUseDesignContext.mockReturnValue({
                    pageUpdateMode: 'client',
                    pageDesignerConfig
                })

                render(<Region page={originalPage} regionId="main" />)

                expect(screen.getByTestId('component-original-component')).toBeInTheDocument()
                expect(mockPageDesignerPageMetadataProvider).toHaveBeenCalledWith({
                    page: originalPage
                })
            }
        )

        test('falls back to the original page when client preview config is omitted', () => {
            const originalPage = createPage('original', 'original-component')
            mockUseDesignContext.mockReturnValue({pageUpdateMode: 'client'})

            render(<Region page={originalPage} regionId="main" />)

            expect(screen.getByTestId('component-original-component')).toBeInTheDocument()
            expect(mockPageDesignerPageMetadataProvider).toHaveBeenCalledWith({
                page: originalPage
            })
        })

        test('uses the latest live page on rerender and returns to the original page outside client mode', () => {
            const originalPage = createPage('original', 'original-component')
            const firstLivePage = createPage('first-live', 'first-live-component')
            const nextLivePage = createPage('next-live', 'next-live-component')
            mockUseDesignContext.mockReturnValue({
                pageUpdateMode: 'client',
                pageDesignerConfig: {page: firstLivePage}
            })

            const {rerender} = render(<Region page={originalPage} regionId="main" />)
            expect(screen.getByTestId('component-first-live-component')).toBeInTheDocument()

            mockUseDesignContext.mockReturnValue({
                pageUpdateMode: 'client',
                pageDesignerConfig: {page: nextLivePage}
            })
            rerender(<Region page={originalPage} regionId="main" />)

            expect(screen.getByTestId('component-next-live-component')).toBeInTheDocument()
            expect(screen.queryByTestId('component-first-live-component')).not.toBeInTheDocument()
            expect(
                mockRegionWrapper.mock.calls[mockRegionWrapper.mock.calls.length - 1]?.[0]
                    .designMetadata
            ).toMatchObject({
                componentTypeInclusions: ['next-live-included']
            })
            expect(
                mockPageDesignerPageMetadataProvider.mock.calls[
                    mockPageDesignerPageMetadataProvider.mock.calls.length - 1
                ]?.[0]
            ).toEqual({
                page: nextLivePage
            })

            mockUseDesignContext.mockReturnValue({pageUpdateMode: 'server'})
            rerender(<Region page={originalPage} regionId="main" />)

            expect(screen.getByTestId('component-original-component')).toBeInTheDocument()
            expect(screen.queryByTestId('component-next-live-component')).not.toBeInTheDocument()
            expect(
                mockRegionWrapper.mock.calls[mockRegionWrapper.mock.calls.length - 1]?.[0]
                    .designMetadata
            ).toMatchObject({
                componentTypeInclusions: ['original-included']
            })
            expect(
                mockPageDesignerPageMetadataProvider.mock.calls[
                    mockPageDesignerPageMetadataProvider.mock.calls.length - 1
                ]?.[0]
            ).toEqual({
                page: originalPage
            })
        })

        test('does not use the original region when it is missing from the live page', () => {
            const originalPage = createPage('original', 'original-component')
            const livePage = {
                id: 'live',
                regions: []
            } as unknown as PageWithDesignMetadata
            mockUseDesignContext.mockReturnValue({
                pageUpdateMode: 'client',
                pageDesignerConfig: {page: livePage}
            })

            render(<Region page={originalPage} regionId="main" errorElement={0} />)

            expect(screen.getByText('0')).toBeInTheDocument()
            expect(screen.queryByTestId(/^component-/)).not.toBeInTheDocument()
            expect(mockRegionWrapper).not.toHaveBeenCalled()
            expect(mockPageDesignerPageMetadataProvider).not.toHaveBeenCalled()
        })

        test.each([
            {
                mode: 'renders the supplied error element',
                errorElement: (
                    <div data-testid="live-region-error" key="live-region-error">
                        Live region unavailable
                    </div>
                ),
                expectedText: 'Live region unavailable'
            },
            {
                mode: 'returns null without an error element',
                errorElement: undefined,
                expectedText: null
            }
        ])(
            'does not fall back to the original region when live data is missing and $mode',
            ({errorElement, expectedText}) => {
                const originalPage = createPage('original', 'original-component')
                const livePage = {
                    id: 'live',
                    regions: []
                } as unknown as PageWithDesignMetadata
                mockUseDesignContext.mockReturnValue({
                    pageUpdateMode: 'client',
                    pageDesignerConfig: {page: livePage}
                })

                const {container} = render(
                    <Region page={originalPage} regionId="main" errorElement={errorElement} />
                )

                expect(container.textContent).toBe(expectedText ?? '')
                expect(container.firstChild).toBe(
                    expectedText === null ? null : screen.getByTestId('live-region-error')
                )
                expect(screen.queryByTestId('component-original-component')).not.toBeInTheDocument()
                expect(mockRegionWrapper).not.toHaveBeenCalled()
                expect(mockPageDesignerPageMetadataProvider).not.toHaveBeenCalled()
            }
        )

        test('uses empty metadata when the live page has no design metadata', () => {
            const originalPage = createPage('original', 'original-component')
            const livePage = {
                id: 'live',
                regions: [
                    {id: 'main', components: [{id: 'live-component', typeId: 'banner', data: {}}]}
                ]
            } as unknown as PageWithDesignMetadata
            mockUseDesignContext.mockReturnValue({
                pageUpdateMode: 'client',
                pageDesignerConfig: {page: livePage}
            })

            render(<Region page={originalPage} regionId="main" />)

            expect(screen.getByTestId('component-live-component')).toBeInTheDocument()
            expect(mockRegionWrapper.mock.calls[0][0].designMetadata).toEqual({
                id: 'main',
                componentTypeExclusions: [],
                componentTypeInclusions: []
            })
            expect(mockPageDesignerPageMetadataProvider).toHaveBeenCalledWith({page: livePage})
        })

        test('ignores conflicting live page data for component regions across rerenders', () => {
            const createHostPage = (id: string, componentId: string) =>
                ({
                    id,
                    regions: [
                        {
                            id: 'nested',
                            components: [{id: componentId, typeId: 'banner', data: {}}]
                        }
                    ],
                    designMetadata: {
                        regionDefinitions: [
                            {
                                id: 'nested',
                                componentTypeExclusions: [`${id}-excluded`],
                                componentTypeInclusions: [`${id}-included`]
                            }
                        ]
                    }
                } as unknown as PageWithDesignMetadata)
            const firstHostPage = createHostPage('live-a', 'host-a-component')
            const nextHostPage = createHostPage('live-b', 'host-b-component')
            const component = {
                id: 'parent-component',
                typeId: 'grid',
                data: {},
                regions: [
                    {
                        id: 'nested',
                        components: [{id: 'nested-component', typeId: 'text', data: {}}]
                    }
                ],
                designMetadata: {
                    regionDefinitions: [
                        {
                            id: 'nested',
                            componentTypeExclusions: ['nested-excluded'],
                            componentTypeInclusions: ['nested-included']
                        }
                    ]
                }
            } as unknown as ComponentType
            mockUseDesignContext.mockReturnValue({
                pageUpdateMode: 'client',
                pageDesignerConfig: {page: firstHostPage}
            })

            const {rerender} = render(<Region component={component} regionId="nested" />)

            expect(screen.getByTestId('component-nested-component')).toBeInTheDocument()
            expect(screen.queryByTestId('component-host-a-component')).not.toBeInTheDocument()
            expect(mockRegionWrapper.mock.calls[0][0].designMetadata).toEqual({
                id: 'nested',
                componentTypeExclusions: ['nested-excluded'],
                componentTypeInclusions: ['nested-included']
            })

            mockUseDesignContext.mockReturnValue({
                pageUpdateMode: 'client',
                pageDesignerConfig: {page: nextHostPage}
            })
            rerender(<Region component={component} regionId="nested" />)

            expect(screen.getByTestId('component-nested-component')).toBeInTheDocument()
            expect(screen.queryByTestId('component-host-a-component')).not.toBeInTheDocument()
            expect(screen.queryByTestId('component-host-b-component')).not.toBeInTheDocument()
            expect(
                mockRegionWrapper.mock.calls[mockRegionWrapper.mock.calls.length - 1]?.[0]
            ).toMatchObject({
                region: component.regions?.[0],
                designMetadata: {
                    id: 'nested',
                    componentTypeExclusions: ['nested-excluded'],
                    componentTypeInclusions: ['nested-included']
                }
            })
            expect(mockPageDesignerPageMetadataProvider).not.toHaveBeenCalled()
        })

        test('renders live page regions inside a region context without registering page metadata', () => {
            const originalPage = createPage('original', 'original-component')
            const livePage = createPage('live', 'live-component')
            mockUseDesignContext.mockReturnValue({
                pageUpdateMode: 'client',
                pageDesignerConfig: {page: livePage}
            })
            mockUseRegionContext.mockReturnValue({regionId: 'parent', contentLinkUuids: []})

            render(<Region page={originalPage} regionId="main" />)

            expect(screen.getByTestId('component-live-component')).toBeInTheDocument()
            expect(mockPageDesignerPageMetadataProvider).not.toHaveBeenCalled()
        })
    })
})
