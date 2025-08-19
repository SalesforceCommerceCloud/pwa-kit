/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const executeCallbacks = (callbacks, props, onError) => {
    return async (...params) => {
        callbacks.reduce(async (data, func, index, arr) => {
            try {
                const next = await data
                const response = await func(...params, props, next)
                return {...next, ...response}
            } catch (error) {
                arr.splice(index)
                onError(error)
            }
        }, {})
    }
}
