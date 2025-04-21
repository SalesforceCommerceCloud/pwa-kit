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

/**
 * A sentinel value used to indicate that a method result has not been cached.
 */
export const NOT_CACHED = Symbol('not-cached')

/**
 * Applies a cache to a method on an instance. The cache is stored in a property on the instance.
 *
 * @param instance - The instance on which to apply the cache.
 * @param methodName - The name of the method to cache.
 * @param cacheProperty - The name of the property to use for caching.
 */
export function cacheMethodResult(instance: any, methodName: string, cacheProperty: string) {
    const originalMethod = instance[methodName]
    if (typeof originalMethod !== 'function') return

    // Initialize the sentinel
    if (instance[cacheProperty] === undefined) {
        instance[cacheProperty] = NOT_CACHED
    }

    instance[methodName] = function (...args: any[]) {
        if (instance[cacheProperty] !== NOT_CACHED) {
            return instance[cacheProperty]
        }

        const result = originalMethod.apply(this, args)

        if (result instanceof Promise) {
            void result.then((resolved) => {
                instance[cacheProperty] = resolved
            })
        } else {
            instance[cacheProperty] = result
        }

        return result
    }
}

/**
 * Checks if the code is running on the server side.
 *
 * @returns {boolean} `true` if running on the server, `false` if running on the client.
 */
export const isServerSide = () => typeof window === 'undefined'
