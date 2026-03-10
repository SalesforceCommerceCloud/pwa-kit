/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {
    createReactAdapter,
    type ReactDesignComponentType
} from '@salesforce/storefront-next-runtime/design/react'
import {ComponentRegistry} from '@salesforce/storefront-next-runtime/design'

/**
 * Factory function to create a React-specific component registry
 * with the React adapter pre-configured.
 */
export function createReactComponentRegistry<TProps>() {
    return new ComponentRegistry<TProps, ReactDesignComponentType<TProps>>({
        adapter: createReactAdapter<TProps>()
    })
}

/**
 * Global component registry instance.
 * Used throughout the application to discover and load components.
 *
 * This singleton instance is configured with:
 * - React adapter for React-specific behavior
 * - Design mode decorator for Page Designer integration
 * - Static component registration via Vite plugin (no dynamic discovery needed)
 * - Component metadata handled via API (not stored in registry)
 */
// We don't care about the type of props of the components.
// Just ignore them or else any combination of props won't be allowed.

export const registry = createReactComponentRegistry<unknown>()
