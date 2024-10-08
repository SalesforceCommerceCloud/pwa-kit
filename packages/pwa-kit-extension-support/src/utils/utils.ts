/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import hoistNonReactStatics from 'hoist-non-react-statics'
import ApplicationExtension from '../core/application-extension'
import {ApplicationExtensionConfig} from '../types'

// NOTE: Similar to how I was thinking that the ExpressJS interface should be a middleware,
// it might also be wise to make the React interface with application extensibility be an HOC.
// This will ensure that in both worlds we are using a familiar pattern. 

/**
 * Applies a series of Higher-Order Components (HOCs) to a given React component.
 *
 * @template T - The type of the React component.
 * @param {T} Component - The React component to which the HOCs will be applied.
 * @param {Array<(component: T) => T>} hocs - An array of Higher-Order Components (HOCs) to apply to the component.
 * @returns {T} - The React component wrapped with the provided HOCs.
 */
export const applyHOCs = <T extends React.ComponentType<any>>(
    Component: T,
    hocs: Array<(component: T) => T>
): T => {
    return hocs.reduce((AccumulatedComponent, hoc) => {
        const WrappedComponent = hoc(AccumulatedComponent)
        return hoistNonReactStatics(WrappedComponent, AccumulatedComponent) as T
    }, Component)
}

/**
 * Given the provided Application, apply all the App extensions to it.
 *
 * @param App
 */
export const applyApplicationExtensions = (
    App: React.ComponentType,
    extensions: ApplicationExtension<ApplicationExtensionConfig>[]
): React.ComponentType => {
    const extendAppHocs = extensions
        .map((extension) => extension.extendApp.bind(extension))
        .filter(Boolean)

    return applyHOCs(App, extendAppHocs)
}
