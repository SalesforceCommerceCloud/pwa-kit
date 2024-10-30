/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import React from 'react'
import hoistNonReactStatics from 'hoist-non-react-statics'

// Local
import {applyHOCs} from '../utils'

// Types
import {ApplicationExtension} from '../classes/ApplicationExtension'
import {ApplicationExtensionConfig as ApplicationExtensionConfigBase} from '../../types'
import {ApplicationExtensionsProvider} from '../contexts'

// Local Types
type withApplicationExtensionsOptions = {
    applicationExtensions: ApplicationExtension<ApplicationExtensionConfigBase>[]
    locals?: any
}

type GenericHocType<C> = (component: React.ComponentType<C>) => React.ComponentType<C>

/**
 * Higher-order component (HOC) that applies application extensions to a wrapped component.
 *
 * This function retrieves all registered application extensions using `getApplicationExtensions()`,
 * and maps them into an array of higher-order components (HOCs). Each HOC is a function
 * that takes a component and returns an extended version of that component.
 *
 * The `applyHOCs` utility is then used to sequentially apply each of these HOCs to
 * the `WrappedComponent`, resulting in a final `ExtendedComponent` that includes
 * all the applied extensions.
 *
 * @template P - The props type for the wrapped component.
 * @param WrappedComponent - The original React component that will be wrapped by extensions.
 * @returns A new React component with all extensions applied, rendering the `WrappedComponent`
 *          with the extended behavior.
 */
const withApplicationExtensions = <C,>(
    WrappedComponent: React.ComponentType<C>,
    options: withApplicationExtensionsOptions
) => {
    const hocs: GenericHocType<C>[] = options.applicationExtensions
        .filter((applicationExtension: any) => applicationExtension.isEnabled())
        .map((extension: any) => extension.extendApp.bind(extension) as GenericHocType<C>)
        .filter(Boolean)
    const withApplicationExtensionsProvider: GenericHocType<any> = (WrappedComponent) => {
        const WithApplicationExtensionsProvider = (props: any) => (
            <ApplicationExtensionsProvider extensions={options.applicationExtensions}>
                <WrappedComponent {...props} />
            </ApplicationExtensionsProvider>
        )

        // Set a display name for easier debugging in React DevTools
        WithApplicationExtensionsProvider.displayName = `WithApplicationExtensionsProvider(${
            WrappedComponent.displayName || WrappedComponent.name || 'Component'
        })`

        return hoistNonReactStatics(WithApplicationExtensionsProvider, WrappedComponent)
    }

    if (options?.locals) {
        options.locals.applicationExtensions = options.applicationExtensions
    }

    return withApplicationExtensionsProvider(applyHOCs(WrappedComponent, hocs))
}

export default withApplicationExtensions
