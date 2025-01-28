/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import React from 'react'

// Local
import {useApplicationExtensionsStore} from '../hooks/useApplicationExtensionsStore'

// Local Types
import {SliceInitializer} from '../hooks/useApplicationExtensionsStore'

// Local Types
type withApplicationExtensionStoreConfig = {
    /**
     * The unique identifier for the slice being added to the store.
     * This ensures that each extension's state is stored separately and uniquely.
     */
    id: string
    /**
     * The initializer function for the slice.
     * This function defines the initial state and actions for the slice being added.
     */
    initializer: SliceInitializer<any>
}

/**
 * Higher-Order Component (HOC) to add a slice to the global store for an extension.
 * This allows extensions to define their own state and actions, which are dynamically added to the global Zustand store.
 *
 * @template C - The props type of the wrapped component.
 * @param WrappedComponent - The React component to wrap with the HOC.
 * @param config - Configuration for the HOC.
 * @param config.id - The unique identifier for the slice being added to the store.
 * @param config.initializer - The initializer function for defining the slice's state and actions.
 * @returns  The original component, unmodified.
 */
const withApplicationExtensionStore = <C,>(
    WrappedComponent: React.ComponentType<C>,
    config: withApplicationExtensionStoreConfig
) => {
    const {id, initializer} = config

    // Because there extensions have unique slice names, we can safely add them to the global store.
    useApplicationExtensionsStore.getState().addSlice(id, initializer)

    // Return the original component as we aren't modifying it in any way... yet.
    return WrappedComponent
}

export default withApplicationExtensionStore
