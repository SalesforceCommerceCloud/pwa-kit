/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

type Node<K extends string> = {id: string} & Record<K, Array<Node<K>>>

/**
 * Flattens a tree data structure into an array.
 * @param {*} node
 * @param key
 * @returns
 */
export const flatten = <K extends string>(node: Node<K>, key: K): Record<string, any> => {
    const children = (node[key] || []).reduce((a, b) => {
        return Array.isArray(b[key]) && !!b[key].length
            ? {...a, ...flatten(b, key)}
            : {...a, [b.id]: b}
    }, {} as Node<K>)

    return {
        [node.id]: node,
        ...children
    }
}
