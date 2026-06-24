/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * The distinct outcomes WI-5 must drive UI off of. Each maps to a specific
 * message + recovery affordance in the return flow.
 *
 * NOTE there is intentionally no `authExpired` kind: a mid-flow 401 is
 * intercepted and consumed by the SDK auth layer (`useAuthorizationHeader` ->
 * `handleInvalidToken`) before page code ever sees it, so it never reaches this
 * classifier. A 401 that somehow does arrive falls through to `unknown`.
 */
export const ReturnErrorKind = Object.freeze({
    INVALID_REASON: 'invalidReason',
    UNKNOWN_ITEMS: 'unknownItems',
    QUANTITY_EXCEEDED: 'quantityExceeded',
    NOT_FOUND: 'notFound',
    CONFLICT: 'conflict',
    NETWORK: 'network',
    UNKNOWN: 'unknown'
})

/**
 * The `errorCode` discriminators the OMS return API returns in a 400 body.
 * These are the contract values per the return OAS (W-22059580); treat any
 * other / missing code as a generic 400 (`unknown`).
 */
const ERROR_CODE_TO_KIND = {
    InvalidReasonCode: ReturnErrorKind.INVALID_REASON,
    UnknownProductItemIds: ReturnErrorKind.UNKNOWN_ITEMS,
    ReturnQuantityExceeded: ReturnErrorKind.QUANTITY_EXCEEDED
    // OrderReturnFailed intentionally omitted -> generic `unknown` (retryable
    // inline); it carries no per-item recovery affordance.
}

/**
 * Read the response body exactly once, defensively.
 *
 * The error thrown by `commerce-sdk-isomorphic` carries a `Response` whose body
 * is a one-shot stream. For 400/404/409 it is unread before we get here, but a
 * caller (or a retry layer) may already have consumed it, or it may not be JSON.
 * Any of those cases falls back to `null` so the caller classifies on status
 * alone — we never throw out of the classifier.
 *
 * @param {Response} response
 * @returns {Promise<Object|null>}
 */
const readBodyOnce = async (response) => {
    if (!response || typeof response.json !== 'function') return null
    // `bodyUsed` is true once the stream has been read; a second read throws.
    if (response.bodyUsed) return null
    try {
        return await response.json()
    } catch {
        return null
    }
}

/**
 * Pull the affected product-item ids out of a `ReturnQuantityExceeded` body.
 *
 * The exact shape is defined in the OAS, not this repo, so this is best-effort:
 * it probes the field names the contract is expected to use and returns [] when
 * none match. Callers must tolerate an empty list (they fall back to a generic
 * "quantities changed" message without naming items).
 *
 * @param {Object|null} body
 * @returns {string[]}
 */
const extractAffectedItemIds = (body) => {
    if (!body || typeof body !== 'object') return []
    // Probe the documented/likely carriers in priority order.
    const candidates =
        body.affectedItemIds ??
        body.productItemIds ??
        (Array.isArray(body.productItems)
            ? body.productItems.map((i) => i?.itemId ?? i?.productItemId).filter(Boolean)
            : undefined) ??
        body.details?.affectedItemIds
    return Array.isArray(candidates) ? candidates.filter(Boolean) : []
}

/**
 * Normalize a return-submit error into a UI-actionable classification.
 *
 * Reads `error.response.status` synchronously and the JSON body once (for the
 * 400 `errorCode` discriminator + affected items). Pure aside from the single
 * body read; never throws.
 *
 * @param {*} error The error thrown by the `ReturnOmsOrder` mutation.
 * @returns {Promise<{kind: string, status: (number|undefined), errorCode: (string|undefined), affectedItemIds: string[]}>}
 */
export const classifyReturnError = async (error) => {
    const response = error?.response
    const status = response?.status

    // No HTTP response at all -> network/timeout (fetch rejected before a
    // response was produced). This also covers a thrown non-Response error.
    if (!response || typeof status !== 'number') {
        return {
            kind: ReturnErrorKind.NETWORK,
            status: undefined,
            errorCode: undefined,
            affectedItemIds: []
        }
    }

    if (status === 404) {
        return {kind: ReturnErrorKind.NOT_FOUND, status, errorCode: undefined, affectedItemIds: []}
    }
    if (status === 409) {
        return {kind: ReturnErrorKind.CONFLICT, status, errorCode: undefined, affectedItemIds: []}
    }

    if (status === 400) {
        const body = await readBodyOnce(response)
        const errorCode = body?.errorCode
        const kind = ERROR_CODE_TO_KIND[errorCode] ?? ReturnErrorKind.UNKNOWN
        const affectedItemIds =
            kind === ReturnErrorKind.QUANTITY_EXCEEDED ? extractAffectedItemIds(body) : []
        return {kind, status, errorCode, affectedItemIds}
    }

    // Any other status (incl. an intercepted-but-leaked 401, or a 5xx) is
    // treated as a generic retryable failure.
    return {kind: ReturnErrorKind.UNKNOWN, status, errorCode: undefined, affectedItemIds: []}
}
