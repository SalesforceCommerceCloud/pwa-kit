/*
 * Copyright (c) 2022.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export function getDependencySource<T extends object>(
    params: T,
    deps: unknown[],
    requiredParams?: Array<keyof T>,
    optionalParams?: Array<keyof T>
): unknown[] {
    if (deps.length) return deps
    const source: unknown[] = []
    requiredParams?.forEach((key) => {
        if (!params.hasOwnProperty(key)) {
            throw new Error(`Missing required parameter "${String(key)}".`)
        }
        source.push(params[key])
    })
    optionalParams?.forEach((key) => {
        source.push(params[key])
    })

    return source
}
