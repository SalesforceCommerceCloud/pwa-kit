/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {type ReactNode} from 'react'
import {usePageDesignerMode} from '@salesforce/storefront-next-runtime/design/react/core'
import {
    createReactRegionDesignDecorator,
    type RegionDesignMetadata
} from '@salesforce/storefront-next-runtime/design/react'

/**
 * Props for the base region renderer
 */
export interface RegionRendererProps extends React.HTMLAttributes<HTMLDivElement> {
    region: any
    children: ReactNode
    designMetadata?: Omit<RegionDesignMetadata, 'componentIds'>
}

/**
 * Base region renderer component that handles the actual DOM structure
 * This is the component that gets decorated in design mode
 */
function RegionRenderer({children}: RegionRendererProps) {
    return <>{children}</>
}

/**
 * Create the design-mode decorated version of the region renderer
 * This wraps the region with Page Designer functionality when in design mode
 */
const DecoratedRegionRenderer = createReactRegionDesignDecorator(RegionRenderer)

/**
 * RegionWrapper - Smart wrapper that conditionally applies design mode decoration
 *
 * This component provides a clean abstraction for rendering regions that:
 * - Automatically detects design mode and applies the appropriate decorator
 * - Maintains a simple API for region rendering
 * - Handles design metadata when in Page Designer
 *
 * @example
 * ```tsx
 * <RegionWrapper regionId={region.id}>
 *   {region.components.map(component => (
 *     <Component key={component.id} component={component} />
 *   ))}
 * </RegionWrapper>
 * ```
 */
export function RegionWrapper({
    region,
    children,
    className,
    designMetadata,
    ...rest
}: RegionRendererProps) {
    const {isDesignMode} = usePageDesignerMode()

    // Memoize the complete design metadata to avoid creating new objects on every render
    const fullDesignMetadata = React.useMemo(
        () => ({
            id: region.id,
            componentIds: region?.components?.map((cmp: any) => cmp.id) || [],
            componentTypeExclusions: designMetadata?.componentTypeExclusions || [],
            componentTypeInclusions: designMetadata?.componentTypeInclusions || []
        }),
        [
            region.id,
            region?.components,
            designMetadata?.componentTypeExclusions,
            designMetadata?.componentTypeInclusions
        ]
    )

    if (isDesignMode && region?.id) {
        return (
            <DecoratedRegionRenderer
                region={region}
                designMetadata={fullDesignMetadata}
                className={className}
                {...rest}
            >
                {children}
            </DecoratedRegionRenderer>
        )
    }

    // At runtime, render directly without decoration overhead
    return (
        <RegionRenderer region={region} className={className} {...rest}>
            {children}
        </RegionRenderer>
    )
}
