/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Config as StoreLocatorConfig} from '../types/config'
import {StoreLocatorProvider} from './provider'

/**
 * Higher-order component that wraps a component with the StoreLocatorProvider
 * @param config Store locator configuration
 * @returns A function that takes a component and returns a wrapped component with access to the store locator config and state
 */
export const withStoreLocator = <P extends object>(
    WrappedComponent: React.ComponentType<P>,
    config: StoreLocatorConfig
): React.ComponentType<P> => {
    const WithConfig = (props: P) => {
        return (
            <StoreLocatorProvider config={config}>
                <WrappedComponent {...props} />
            </StoreLocatorProvider>
        )
    }

    // Preserve the display name for debugging
    WithConfig.displayName = `WithStoreLocator(${
        WrappedComponent.displayName || WrappedComponent.name || 'Component'
    })`

    return WithConfig
}
