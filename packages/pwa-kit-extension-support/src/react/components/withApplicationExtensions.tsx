/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import React from 'react'

// Local
import {applyHOCs} from '../utils'
import applicationExtensions from '../assets/application-extensions-placeholder'

// Types
import {ApplicationExtension} from '../ApplicationExtension'
import {ApplicationExtensionConfig as ApplicationExtensionConfigBase} from '../../types'

type withApplicationExtensionsOptions = {
    locals?: any
}

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
type GenericHocType<C> = (component: React.ComponentType<C>) => React.ComponentType<C>

const withApplicationExtensions = <
    C,
    P extends ApplicationExtension<ApplicationExtensionConfigBase>
>(
    WrappedComponent: React.ComponentType<C>,
    options: withApplicationExtensionsOptions
) => {
    const hocs: GenericHocType<C>[] = applicationExtensions
        .filter((applicationExtension) => applicationExtension.isEnabled())
        .map((extension: any) => extension.extendApp.bind(extension) as GenericHocType<C>)
        .filter(Boolean)

    if (options?.locals) {
        options.locals.applicationExtensions = applicationExtensions
    }

    return applyHOCs(WrappedComponent, hocs)
}

export default withApplicationExtensions
