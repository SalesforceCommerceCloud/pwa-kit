/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {type ReactElement, type ReactNode, Suspense} from 'react'
import {Component} from '../Component'
import {RegionWrapper} from './region-wrapper'
import type {ShopperExperience} from '@salesforce/storefront-next-runtime/scapi'
import {
    PageDesignerPageMetadataProvider,
    useRegionContext
} from '@salesforce/storefront-next-runtime/design/react/core'
import type {
    ComponentDecoratorProps,
    ComponentDesignMetadata,
    RegionDesignMetadata
} from '@salesforce/storefront-next-runtime/design/react'

export type {RegionDesignMetadata}

export interface PageDesignMetadata {
    id: string
    name: string
    description?: string
    archType?: 'controller' | 'headless'
    route?: string
    supportedAspectTypes?: string[]
    regionDefinitions?: RegionDesignMetadata[]
    attributeDefinitionGroups?: {
        id: string
        name?: string
        description?: string
        attributeDefinitions?: Record<string, unknown>[]
    }[]
}

export type PageDecoratorProps<TProps> = React.PropsWithChildren<
    {
        designMetadata?: PageDesignMetadata
    } & TProps
>

// Extended Page type with design metadata
type PageWithDesignMetadata = PageDecoratorProps<ShopperExperience.schemas['Page']> & {
    componentData?: Record<string, Promise<unknown>>
}

// Props when rendering a page-level region
interface PageRegionProps extends React.HTMLAttributes<HTMLDivElement> {
    page: PageWithDesignMetadata
    component?: never
    regionId: string
    fallbackElement?: ReactNode
    errorElement?: ReactNode
}

export type ComponentType = ComponentDecoratorProps<ShopperExperience.schemas['Component']>

// Props when rendering a component-level region (nested)
interface ComponentRegionProps extends React.HTMLAttributes<HTMLDivElement> {
    page?: never
    component: ComponentType
    regionId: string
    fallbackElement?: ReactNode
    errorElement?: ReactNode
}

// Discriminated union
export type RegionProps = PageRegionProps | ComponentRegionProps

// Helper: Extract design metadata from region definition
function getDesignMetadata(regionId: string, metadata?: RegionDesignMetadata) {
    return {
        id: regionId,
        componentTypeExclusions: metadata?.componentTypeExclusions ?? [],
        componentTypeInclusions: metadata?.componentTypeInclusions ?? []
    }
}

// Helper: Render region wrapper with components
function renderRegionContent(
    region: ShopperExperience.schemas['Region'],
    regionId: string,
    metadata: RegionDesignMetadata | undefined,
    className: string,
    rest: React.HTMLAttributes<HTMLDivElement>
) {
    return (
        <RegionWrapper
            region={region}
            className={className}
            designMetadata={getDesignMetadata(regionId, metadata)}
            {...rest}
        >
            {region.components?.map(
                (comp) =>
                    comp.id && (
                        <Component
                            key={comp.id}
                            component={comp as ComponentType}
                            regionId={region.id}
                        />
                    )
            )}
        </RegionWrapper>
    )
}

/**
 * Region - Renders a Page Designer region from Salesforce's ShopperExperience API data
 *
 * This component supports two distinct modes via a discriminated union:
 *
 * 1. **Page Mode** - For route-level regions:
 *    ```tsx
 *    <Region page={loaderData.page} regionId="main" fallbackElement={<Skeleton />} />
 *    ```
 *    - Accepts page (Promise<PageWithComponentData> or PageWithComponentData)
 *    - Wraps in Suspense for async loading
 *    - Provides ComponentDataContext at page level
 *    - Registers PageDesignerPageMetadataProvider for root regions
 *
 * 2. **Component Mode** - For nested regions in layout components:
 *    ```tsx
 *    <Region component={component} regionId="main" errorElement={children} />
 *    ```
 *    - Accepts component (ShopperExperience.schemas['Component'])
 *    - Synchronous rendering (no Suspense overhead)
 *    - Inherits ComponentDataContext from parent
 *    - No PageDesignerPageMetadataProvider (only for page-level)
 *
 * Key Functionality:
 * - TypeScript enforces you pass EITHER page OR component, never both
 * - Finds the region by ID within the page or component
 * - Renders all components within the region using the Component wrapper
 * - Supports region-specific fallback and error elements
 * - Handles metadata for component type inclusions/exclusions
 *
 * Use Case: Foundational component in Salesforce's Page Designer system for rendering
 * regions that can contain multiple components managed through the Page Designer interface.
 */
export function Region(props: RegionProps): ReactElement | null {
    const {regionId, className = '', errorElement, fallbackElement = <div />, ...rest} = props
    const regionContext = useRegionContext()

    // COMPONENT MODE: Rendering a component-level region (nested)
    if (props.component !== undefined) {
        const region = props.component.regions?.find((r) => r.id === regionId)
        if (!region) {
            return errorElement ? <>{errorElement}</> : null
        }

        const metadata = (
            props.component.designMetadata as ComponentDesignMetadata & {
                regionDefinitions?: RegionDesignMetadata[]
            }
        )?.regionDefinitions?.find((r: RegionDesignMetadata) => r.id === regionId)
        return renderRegionContent(region, regionId, metadata, className, rest)
    }

    // PAGE MODE: Rendering a page-level region
    const page = props.page
    const region = page?.regions?.find((r) => r.id === regionId)
    if (!region) {
        return errorElement ? <>{errorElement}</> : null
    }

    const metadata = page.designMetadata?.regionDefinitions?.find((r) => r.id === regionId)
    const {...pageData} = page

    return (
        <Suspense fallback={fallbackElement}>
            {!regionContext && <PageDesignerPageMetadataProvider page={pageData} />}
            {renderRegionContent(region, regionId, metadata, className, rest)}
        </Suspense>
    )
}

export default Region
// Re-export RegionWrapper for direct usage if needed
export {RegionWrapper} from './region-wrapper'
export type {RegionRendererProps} from './region-wrapper'
