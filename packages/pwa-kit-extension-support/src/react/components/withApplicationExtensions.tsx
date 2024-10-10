/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

// Local
import {applyHOCs} from '../utils'
import {getApplicationExtensions} from '../../shared/utils/universal-utils'

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

const withApplicationExtensions = <P extends {}>(WrappedComponent: React.ComponentType<P>, options: withApplicationExtensionsOptions) => {
    const extensions = getApplicationExtensions()
    const extendAppHocs: Array<(component: React.ComponentType<P>) => React.ComponentType<P>> = extensions
        .map((extension) => extension.extendApp.bind(extension))
        .filter(Boolean)
  
    if (options?.locals) {
        options.locals.applicationExtensions = extensions
    }

    return applyHOCs(WrappedComponent, extendAppHocs)
}

export default withApplicationExtensions
