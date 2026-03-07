/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export * from './Component'
export * from './Region'
export * from './Page'
export * from './prop-types'
export * from './registry'

// Re-export Page Designer utilities from runtime package for convenience
export {
    PageDesignerProvider,
    usePageDesignerMode
} from '@salesforce/storefront-next-runtime/design/react/core'

// Re-export mode detection utilities
export {
    isDesignModeActive,
    isPreviewModeActive
} from '@salesforce/storefront-next-runtime/design/mode'
export type {
    ComponentDesignMetadata,
    RegionDesignMetadata
} from '@salesforce/storefront-next-runtime/design/react'

// Export types
export type {ComponentType, PageWithDesignMetadata} from './types'
