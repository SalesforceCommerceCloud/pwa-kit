/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Kept in one place so the PDP and the widget agree. Matches
// MAX_PDP_QUESTIONS in the widget (src/provider/pdp-questions.ts).
export const MAX_PDP_QUESTIONS = 5

/**
 * Parse the SCAPI `c_pdpQuestions` custom attribute into a sanitized list of
 * opener questions. The SCAPI response ships the value as a JSON-encoded
 * string (an array of strings), so we must JSON.parse it and defend against
 * malformed / non-array / non-string content — a bad publish upstream must
 * never break the PDP.
 *
 * Expected input (what the backend should publish into `pdpQuestions` /
 * SCAPI `c_pdpQuestions`): a JSON-encoded string array, e.g.
 *
 *     '["What does SmartTrack do?","Does it track sleep automatically?"]'
 *
 * Where the questions come from: Commerce Content Studio (an operator-run
 * tool outside the storefront) generates PDP FAQ questions per product with
 * an LLM, keeps them behind a human review gate, and publishes approved
 * content back to Business Manager via OCAPI's `sfcc-site-archive-import`
 * job in MERGE mode. The import writes the JSON string array into the
 * `pdpQuestions` product custom attribute, which SCAPI exposes as
 * `c_pdpQuestions` on the Shopper Products response. See the Commerce
 * Content Studio User Guide (step 7 — Write-back) for the publishing side.
 *
 * Returns [] for any unusable input. Trims, drops empties, dedupes, and caps
 * at MAX_PDP_QUESTIONS to keep the UI from getting overwhelmed. SSR-safe.
 *
 * Malformed input is logged via `console.warn` so a merchandiser who
 * published a bad value can see what tripped the parser in the browser
 * console; the PDP still renders without a pill shelf.
 */
export const parsePdpQuestions = (raw, maxCount = MAX_PDP_QUESTIONS) => {
    if (!raw || typeof raw !== 'string') return []
    let parsed
    try {
        parsed = JSON.parse(raw)
    } catch (err) {
        console.warn(
            '[inline-agent-widget] Ignoring malformed c_pdpQuestions: not valid JSON. ' +
                'Expected a JSON-encoded string array, e.g. \'["Q1?","Q2?"]\'. Got:',
            raw,
            err
        )
        return []
    }
    if (!Array.isArray(parsed)) {
        console.warn(
            '[inline-agent-widget] Ignoring malformed c_pdpQuestions: parsed value is not an array. ' +
                'Expected a JSON-encoded string array, e.g. \'["Q1?","Q2?"]\'. Got:',
            parsed
        )
        return []
    }

    const seen = new Set()
    const out = []
    for (const q of parsed) {
        if (typeof q !== 'string') continue
        const trimmed = q.trim()
        if (!trimmed || seen.has(trimmed)) continue
        seen.add(trimmed)
        out.push(trimmed)
        if (out.length >= maxCount) break
    }
    return out
}
