/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {
    type ReactElement,
    memo,
    Suspense,
    type ComponentType as ReactComponentType
} from 'react'
import {registry} from '../registry'
import type {ComponentDesignMetadata} from '@salesforce/storefront-next-runtime/design/react'
import type {ComponentType} from '../types'

export interface ComponentProps {
    component: ComponentType
    className?: string
    regionId: string
}

/**
 * Props that are passed to dynamic components loaded from the registry.
 * This includes design metadata, component data, and region information.
 */
interface DynamicComponentProps extends Record<string, unknown> {
    designMetadata: ComponentDesignMetadata
    component: ComponentType
    regions?: ComponentType['regions']
    className?: string
    regionId: string
}

export const Component = memo(function Component({
    component,
    className,
    regionId
}: ComponentProps): ReactElement {
    // Get this component's data promise from context by its ID
    const FallbackComponent = registry.getFallback(component.typeId)
    const DynamicComponent = registry.getComponent(component.typeId)

    if (!DynamicComponent) {
        throw registry.preload(component.typeId)
    }

    // visible and localized are runtime properties not in the API schema
    const componentWithRuntimeProps = component as ComponentType & {
        visible?: boolean
        localized?: boolean
    }
    const designMetadata: ComponentDesignMetadata = {
        name: component.designMetadata?.name,
        isFragment: false,
        isVisible: Boolean(componentWithRuntimeProps.visible),
        isLocalized: Boolean(componentWithRuntimeProps.localized),
        id: component.id
    }

    // Cast DynamicComponent to accept our props since registry returns unknown type
    const ComponentToRender = DynamicComponent as ReactComponentType<DynamicComponentProps>

    const componentElement = (
        <ComponentToRender
            {...(component.data ?? {})}
            designMetadata={designMetadata}
            component={component}
            regions={component.regions}
            className={className}
            regionId={regionId}
        />
    )

    // Only use Suspense on the client side since during SSR it will respond with the whole page loaded
    const isClient = typeof window !== 'undefined'

    if (!isClient) {
        return <div>{componentElement}</div>
    }

    return (
        <Suspense
            fallback={
                FallbackComponent ? <FallbackComponent {...(component.data ?? {})} /> : <div />
            }
        >
            {componentElement}
        </Suspense>
    )
})
