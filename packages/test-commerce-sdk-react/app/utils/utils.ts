/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
type RecursiveList<K extends string, T extends RecursiveList<K, T>> = {id: string} & Partial<
    Record<K, T[]>
>
/**
 * Flattens a tree data structure
 * @param {*} node
 * @param key
 * @returns
 */
export const flatten = <K extends string, T extends RecursiveList<K, T>>(
    node: T,
    key: K
): Record<string, T> => {
    const base = {[node.id]: node}
    const children = node[key]
    if (!Array.isArray(children) || children.length === 0) return base
    return children.reduce(
        (result, child) => ({
            ...result,
            ...flatten(child, key)
        }),
        base
    )
}
