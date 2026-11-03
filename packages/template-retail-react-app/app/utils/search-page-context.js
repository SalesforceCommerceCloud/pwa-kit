/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export function searchPageContext(query, refinements = []) {
    if (!query?.trim()) return undefined
    const values = new Map()
    const context = {type: 'srp', query: query.trim()}
    for (const refinement of refinements) {
        if (typeof refinement !== 'string') continue
        const index = refinement.indexOf('=')
        if (index < 1) continue
        const name = refinement.slice(0, index)
        const value = refinement.slice(index + 1)
        if (name === 'price') {
            const range = value.match(/^\((\d+(?:\.\d+)?)?\.\.(\d+(?:\.\d+)?)?\)$/)
            if (range) {
                if (range[1]) context.minPrice = Number(range[1])
                if (range[2]) context.maxPrice = Number(range[2])
                continue
            }
        }
        if (value)
            values.set(name, [...(values.get(name) || []), ...value.split('|').filter(Boolean)])
    }
    if (values.size) context.refinements = [...values].map(([name, values]) => ({name, values}))
    return context
}
