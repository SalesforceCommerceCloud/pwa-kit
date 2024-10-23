/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import React from 'react'
import hoistNonReactStatics from 'hoist-non-react-statics'

/**
 * Applies a series of Higher-Order Components (HOCs) to a given React component.
 *
 * @template T - The type of the React component.
 * @param {T} Component - The React component to which the HOCs will be applied.
 * @param {Array<(component: T) => T>} hocs - An array of Higher-Order Components (HOCs) to apply to the component.
 * @returns {T} - The React component wrapped with the provided HOCs.
 */
export const applyHOCs = <T extends React.ComponentType<any>>(Component: T, hocs: any): T => {
    return hocs.reduce((AccumulatedComponent: any, hoc: any) => {
        const WrappedComponent = hoc(AccumulatedComponent)
        return hoistNonReactStatics(WrappedComponent, AccumulatedComponent) as T
    }, Component)
}

// export const applyHOCs = <T extends React.ComponentType<any>>(Component: T, hocs: Array<(component: T) => T>): T => {
//     return hocs.reduce((AccumulatedComponent: T, hoc: (component: T) => T) => {
//         const WrappedComponent = hoc(AccumulatedComponent);
//         return hoistNonReactStatics(WrappedComponent, AccumulatedComponent) as T;
//     }, Component);
// }
