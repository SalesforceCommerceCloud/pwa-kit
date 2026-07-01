/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Salesforce Order Management (SOM) only exposes a status per line item; it does not provide a
 * single, reliable order-level status (the order-level `omsData.status` can lag behind the items,
 * e.g. it stays "approved" after every item is cancelled). This utility aggregates the item-level
 * statuses into a single order-level display status following the Shopper Agent Order Level Status
 * Matrix.
 *
 * This module is the pure aggregation logic only. Presenting the result in the order status badge
 * (localized labels, badge color, cancel-CTA gating) is handled separately in the
 * `OrderStatusBadge` component.
 */

/** Canonical order-level display status keys produced by {@link getOrderDisplayStatus}. */
export const ORDER_DISPLAY_STATUS = {
    ORDERED: 'ORDERED',
    IN_PROGRESS: 'IN_PROGRESS',
    PARTIALLY_SHIPPED: 'PARTIALLY_SHIPPED',
    SHIPPED: 'SHIPPED',
    PART_ORDER_DELIVERED: 'PART_ORDER_DELIVERED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED',
    RETURN_INITIATED: 'RETURN_INITIATED',
    PARTIAL_RETURN_INITIATED: 'PARTIAL_RETURN_INITIATED',
    RETURN_COMPLETE: 'RETURN_COMPLETE',
    PARTIAL_RETURN_COMPLETE: 'PARTIAL_RETURN_COMPLETE'
}

/**
 * The subset of {@link ORDER_DISPLAY_STATUS} values that represent a return in some stage. The order
 * status badge treats these as a single "is this a return?" group so the cancelled branch (red) and
 * the raw fallback (green) stay untouched; return states render in a neutral badge with their own
 * localized label. Kept as a Set for O(1) membership checks in the badge components.
 */
export const RETURN_DISPLAY_STATUSES = new Set([
    ORDER_DISPLAY_STATUS.RETURN_INITIATED,
    ORDER_DISPLAY_STATUS.PARTIAL_RETURN_INITIATED,
    ORDER_DISPLAY_STATUS.RETURN_COMPLETE,
    ORDER_DISPLAY_STATUS.PARTIAL_RETURN_COMPLETE
])

/**
 * @param {string|null} displayStatus a value returned by {@link getOrderDisplayStatus}
 * @returns {boolean} true when the status is one of the four return states
 */
export function isReturnDisplayStatus(displayStatus) {
    return RETURN_DISPLAY_STATUSES.has(displayStatus)
}

/** Canonical item-level buckets that raw SOM item statuses normalize into. */
const ITEM_BUCKET = {
    ORDERED: 'ordered',
    IN_PROGRESS: 'in_progress',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    RETURN_INITIATED: 'return_initiated',
    RETURNED: 'returned'
}

/**
 * Case-insensitive exact-match map from a raw SOM item status to a canonical {@link ITEM_BUCKET}.
 * The item-level vocabulary is a finite, known set derived from SOM's fulfillment-order state
 * machine (not free text), so an exact map is both safer and more readable than substring matching
 * — substring matching mis-classifies values like "reorder"/"preorder" (→ ORDERED) or
 * "worship"/"kinship" (→ SHIPPED). Keys must be lowercase; lookups lowercase the input first.
 *
 * Note: "allocated" and "fulfilled" are intentionally mapped to IN_PROGRESS, not a terminal state.
 * Both are upstream fulfillment-order (FO) milestones: an FO is created/"allocated" when a warehouse
 * picks up the order, and "Fulfillment Order is Fulfilled" means that FO's work is done — but the
 * Shipment entity (and actual delivery) is created later, after the FO. So "fulfilled" is in-flight,
 * not delivered; mapping it to a terminal, customer-visible "Delivered" badge would be wrong.
 */
const STATUS_MAP = {
    ordered: ITEM_BUCKET.ORDERED,
    created: ITEM_BUCKET.ORDERED,
    new: ITEM_BUCKET.ORDERED,
    open: ITEM_BUCKET.ORDERED,
    placed: ITEM_BUCKET.ORDERED,
    'in progress': ITEM_BUCKET.IN_PROGRESS,
    processing: ITEM_BUCKET.IN_PROGRESS,
    allocated: ITEM_BUCKET.IN_PROGRESS,
    fulfilled: ITEM_BUCKET.IN_PROGRESS,
    shipped: ITEM_BUCKET.SHIPPED,
    'in transit': ITEM_BUCKET.SHIPPED,
    delivered: ITEM_BUCKET.DELIVERED,
    canceled: ITEM_BUCKET.CANCELLED,
    cancelled: ITEM_BUCKET.CANCELLED,
    'return initiated': ITEM_BUCKET.RETURN_INITIATED,
    'return requested': ITEM_BUCKET.RETURN_INITIATED,
    returned: ITEM_BUCKET.RETURNED
}

/**
 * Maps a raw item-level `omsData.status` string to a canonical {@link ITEM_BUCKET} via a
 * case-insensitive exact-match lookup ({@link STATUS_MAP}). Unknown values fall back to
 * `in_progress` (a safe, non-terminal bucket) so an unexpected status never reads as a terminal
 * state like "Delivered" or "Cancelled".
 *
 * @param {string} rawStatus item-level omsData.status
 * @returns {string|undefined} canonical bucket, or undefined when no status is provided
 */
export function normalizeItemStatus(rawStatus) {
    if (!rawStatus || typeof rawStatus !== 'string') return undefined
    const s = rawStatus.trim().toLowerCase()
    if (!s) return undefined
    // Unknown status: treat as in-progress rather than risk an incorrect terminal state.
    return STATUS_MAP[s] ?? ITEM_BUCKET.IN_PROGRESS
}

/**
 * Coerce an OMS quantity field (sent as a JSON `double`, e.g. `2.0`) into a non-negative integer
 * count, or `null` when it isn't a usable number. `Math.trunc` guards against float dust.
 */
function toCount(value) {
    if (!Number.isFinite(value)) return null
    const n = Math.trunc(value)
    return n > 0 ? n : 0
}

/**
 * Expand a single line item into one canonical {@link ITEM_BUCKET} per ordered *unit*.
 *
 * A line item with `quantityOrdered > 1` can straddle several states at once — e.g. the shopper
 * returned 1 of 2 units while the other is still fulfilled. The line's `omsData.status` string only
 * describes the units that are *not* in a cancel/return flow, so aggregating off that string alone
 * mis-reads a partially-returned line as merely "in progress". We reconstruct the true per-unit
 * breakdown from the quantity fields:
 *
 *   - `quantityCanceled` units            -> CANCELLED
 *   - `quantityReturned` units            -> RETURNED            (returns that completed)
 *   - `quantityReturnInitiated - returned`-> RETURN_INITIATED    (returns still in flight)
 *   - the remainder                       -> the `status`-string bucket (fulfilled/shipped/…)
 *
 * `quantityReturnInitiated` is cumulative (it already counts the units in `quantityReturned`), which
 * is exactly what keeps `quantityAvailableToReturn = quantityOrdered - quantityCanceled -
 * quantityReturnInitiated`. The remainder is therefore the units still in the line's fulfillment
 * state and available to return.
 *
 * When the quantity breakdown is absent (legacy/ECOM-shaped items, or a status-only fixture), we
 * fall back to a single bucket for the whole line so the status-only matrix behavior is preserved.
 *
 * @param {object} item a `productItems[*]` entry
 * @returns {Array<string|undefined>} one bucket per unit (status-driven units may be `undefined`)
 */
function getItemUnitBuckets(item) {
    const oms = item?.omsData
    const statusBucket = normalizeItemStatus(oms?.status)

    const ordered = toCount(oms?.quantityOrdered)
    // No usable quantity breakdown: keep the legacy one-bucket-per-line behavior.
    if (ordered == null) return [statusBucket]

    const canceled = toCount(oms?.quantityCanceled) ?? 0
    const returned = toCount(oms?.quantityReturned) ?? 0
    const returnInitiated = toCount(oms?.quantityReturnInitiated) ?? 0

    // In-flight returns are the initiated units that haven't completed yet.
    const inFlightReturns = Math.max(0, returnInitiated - returned)
    // Units still in the line's fulfillment state (not cancelled, not in any return flow).
    const remaining = Math.max(0, ordered - canceled - returnInitiated)

    const buckets = []
    for (let i = 0; i < canceled; i++) buckets.push(ITEM_BUCKET.CANCELLED)
    for (let i = 0; i < returned; i++) buckets.push(ITEM_BUCKET.RETURNED)
    for (let i = 0; i < inFlightReturns; i++) buckets.push(ITEM_BUCKET.RETURN_INITIATED)
    for (let i = 0; i < remaining; i++) buckets.push(statusBucket)

    // Defensive: if the fields are internally inconsistent and produced nothing, fall back to the
    // line status so the item still counts toward the order rather than vanishing.
    return buckets.length ? buckets : [statusBucket]
}

/**
 * Aggregates item-level SOM statuses on an order into a single order-level display status, following
 * the Shopper Agent Order Level Status Matrix.
 *
 * Returns `null` when no line item carries an `omsData.status` — this signals the caller to fall
 * back to the raw `order.status || order.omsData?.status` (the existing behavior for ECOM-only
 * orders and for OMS orders that only expose order/shipment-level status).
 *
 * @param {object} order order object (expects `productItems[*].omsData.status`)
 * @returns {string|null} an {@link ORDER_DISPLAY_STATUS} value, or null to fall back
 */
export function getOrderDisplayStatus(order) {
    const items = order?.productItems
    if (!Array.isArray(items) || items.length === 0) return null

    // Expand EVERY line item into one bucket per ordered unit (so a line that's partially
    // cancelled/returned is represented by all of its states, not just its status string). Units
    // without a usable status stay `undefined` so they still count toward the order (rather than
    // being silently dropped, which would let a partial order masquerade as a terminal all-items
    // state).
    const buckets = items.flatMap((item) => getItemUnitBuckets(item))

    // No item carries an item-level status: signal the caller to fall back to the raw order status.
    if (!buckets.some((bucket) => bucket != null)) return null

    // A fully-cancelled order: every item is cancelled. (SOM models a full cancel this way.)
    if (buckets.every((bucket) => bucket === ITEM_BUCKET.CANCELLED)) {
        return ORDER_DISPLAY_STATUS.CANCELLED
    }

    // Cancelled line items are terminally removed from the order, so the order-level status is
    // derived from the remaining "active" items. An active item missing a status is kept as a
    // non-terminal `undefined` bucket: it prevents a terminal all-items state (e.g. one delivered
    // item + one not-yet-ingested item is "Partially Delivered", not "Delivered") without itself
    // implying any particular progress.
    const active = buckets.filter((bucket) => bucket !== ITEM_BUCKET.CANCELLED)
    const set = new Set(active)
    const all = (bucket) => active.every((b) => b === bucket)
    const some = (bucket) => set.has(bucket)
    const someUnknown = set.has(undefined)

    // Returns take precedence over the upstream fulfillment states they evolve from.
    if (some(ITEM_BUCKET.RETURNED) || some(ITEM_BUCKET.RETURN_INITIATED)) {
        if (all(ITEM_BUCKET.RETURNED)) return ORDER_DISPLAY_STATUS.RETURN_COMPLETE
        if (all(ITEM_BUCKET.RETURN_INITIATED)) return ORDER_DISPLAY_STATUS.RETURN_INITIATED
        // A mix that still contains an in-flight return reads as "partial return initiated";
        // otherwise some items are fully returned while others were never returned.
        if (some(ITEM_BUCKET.RETURN_INITIATED)) return ORDER_DISPLAY_STATUS.PARTIAL_RETURN_INITIATED
        return ORDER_DISPLAY_STATUS.PARTIAL_RETURN_COMPLETE
    }

    if (all(ITEM_BUCKET.DELIVERED)) return ORDER_DISPLAY_STATUS.DELIVERED
    // Delivered mixed with shipped or not-yet-shipped items is still partway through delivery.
    if (some(ITEM_BUCKET.DELIVERED)) return ORDER_DISPLAY_STATUS.PART_ORDER_DELIVERED

    if (all(ITEM_BUCKET.SHIPPED)) return ORDER_DISPLAY_STATUS.SHIPPED
    if (some(ITEM_BUCKET.SHIPPED)) return ORDER_DISPLAY_STATUS.PARTIALLY_SHIPPED

    // An in-progress item, or an active item whose status we couldn't resolve, reads as in progress.
    if (some(ITEM_BUCKET.IN_PROGRESS) || someUnknown) return ORDER_DISPLAY_STATUS.IN_PROGRESS

    return ORDER_DISPLAY_STATUS.ORDERED
}
