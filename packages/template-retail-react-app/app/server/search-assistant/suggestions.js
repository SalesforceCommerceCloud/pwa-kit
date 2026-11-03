/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {textOnly} from '../catalog-facts'
// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths -- SSR modules execute directly in Node.
import {conversationHistory} from './session-store'

export function followUpSuggestions(entry, picks = [...entry.products.values()].slice(0, 3)) {
    if (!entry.total || !picks.length) return []
    const candidates = []
    const add = (id, question) => {
        if (question.length <= 130) candidates.push({id, question})
    }
    // Result facets supply real distinctions even before product descriptions are hydrated.
    const facets = entry.refinements.filter((facet) =>
        /feature|activity|material|fabric|type|brand/i.test(`${facet.attributeId} ${facet.label}`)
    )
    for (const facet of facets) {
        const values = (facet.values || []).filter(
            (value) => value.hitCount > 0 && value.hitCount < entry.total
        )
        for (const value of values.slice(0, 3)) {
            const label = textOnly(value.label, 45)
            if (!label || /https?:|[<>]/i.test(label)) continue
            const material = /material|fabric/i.test(`${facet.attributeId} ${facet.label}`)
            const activity = /activity/i.test(`${facet.attributeId} ${facet.label}`)
            const question = material
                ? `Which matches use ${label.toLowerCase()}?`
                : activity
                ? `Which matches are suited to ${label.toLowerCase()}?`
                : `Which options have the “${label}” feature?`
            add(`facet:${facet.attributeId}:${label}`, question)
        }
    }
    const prices = picks
        .map((product) => Number(String(product.price ?? '').replace(/^from\s+/i, '')))
        .filter((price) => Number.isFinite(price) && price > 0)
    if (prices.length > 1 && Math.max(...prices) > Math.min(...prices)) {
        const budget = Math.ceil((Math.min(...prices) + Math.max(...prices)) / 2 / 10) * 10
        const money = new Intl.NumberFormat(entry.parameters.locale, {
            style: 'currency',
            currency: entry.parameters.currency,
            maximumFractionDigits: 0
        }).format(budget)
        candidates.unshift({
            id: `budget:${budget}`,
            question: `What are my options under ${money}?`
        })
    }
    if (picks.length > 1) {
        const question = `Compare ${picks[0].name} with ${picks[1].name}.`
        if (question.length <= 130)
            candidates.unshift({id: `compare:${picks[0].id}:${picks[1].id}`, question})
    }
    const asked = new Set(conversationHistory(entry).map((turn) => turn.question.toLowerCase()))
    return candidates
        .filter(
            (candidate, index) =>
                !asked.has(candidate.question.toLowerCase()) &&
                candidates.findIndex((other) => other.question === candidate.question) === index
        )
        .slice(0, 3)
}
