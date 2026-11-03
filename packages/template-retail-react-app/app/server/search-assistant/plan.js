/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const invalidPlan = (code) => {
    const error = new Error('Invalid assistant plan')
    error.code = code
    return error
}

export function parseFollowUpPlan(text, products) {
    // Accept a provider's code fence or brief preamble, then validate the same strict schema.
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
    const candidate = (fenced ? fenced[1] : text).trim()
    let plan
    try {
        plan = JSON.parse(candidate)
    } catch {
        const start = candidate.indexOf('{')
        const end = candidate.lastIndexOf('}')
        if (start < 0 || end < start) {
            const error = invalidPlan('plan_framing')
            error.chars = text.length
            throw error
        }
        plan = JSON.parse(candidate.slice(start, end + 1))
    }
    if (!plan || typeof plan !== 'object') throw invalidPlan('plan_object')
    if (!['answer', 'search'].includes(plan.action)) throw invalidPlan('plan_action')
    const query = typeof plan.query === 'string' ? plan.query.trim().replace(/\p{Cc}/gu, '') : ''
    if (plan.action === 'search' && (!query || query.length > 200)) throw invalidPlan('plan_query')
    const ids = Array.isArray(plan.product_ids)
        ? [...new Set(plan.product_ids)]
              .filter((id) => typeof id === 'string' && products.has(id))
              .slice(0, 3)
        : []
    return {action: plan.action, query, ids}
}
