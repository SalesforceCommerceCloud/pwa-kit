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
 * Returns [] for any unusable input. Trims, drops empties, dedupes, and caps
 * at MAX_PDP_QUESTIONS to keep the UI from getting overwhelmed. SSR-safe.
 */
export const parsePdpQuestions = (raw, maxCount = MAX_PDP_QUESTIONS) => {
    if (!raw || typeof raw !== 'string') return []
    let parsed
    try {
        parsed = JSON.parse(raw)
    } catch {
        return []
    }
    if (!Array.isArray(parsed)) return []

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
