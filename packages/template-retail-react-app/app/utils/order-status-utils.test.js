/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    ORDER_DISPLAY_STATUS,
    getOrderDisplayStatus,
    normalizeItemStatus
} from '@salesforce/retail-react-app/app/utils/order-status-utils'

/** Build an order whose productItems carry the given item-level omsData statuses. */
const orderWithItemStatuses = (statuses) => ({
    orderNo: 'test-order',
    productItems: statuses.map((status, i) => ({
        productId: `product-${i}`,
        quantity: 1,
        omsData: status == null ? undefined : {status}
    }))
})

describe('normalizeItemStatus', () => {
    test.each([
        ['allocated', 'in_progress'],
        ['Fulfilled', 'in_progress'],
        ['In Progress', 'in_progress'],
        ['Processing', 'in_progress'],
        ['Created', 'ordered'],
        ['new', 'ordered'],
        ['Ordered', 'ordered'],
        ['SHIPPED', 'shipped'],
        ['In Transit', 'shipped'],
        ['Delivered', 'delivered'],
        ['canceled', 'cancelled'],
        ['Cancelled', 'cancelled'],
        ['Return Initiated', 'return_initiated'],
        ['Return Requested', 'return_initiated'],
        ['Returned', 'returned']
    ])('normalizes %s -> %s', (raw, expected) => {
        expect(normalizeItemStatus(raw)).toBe(expected)
    })

    test('returns undefined for empty/invalid input', () => {
        expect(normalizeItemStatus(undefined)).toBeUndefined()
        expect(normalizeItemStatus('')).toBeUndefined()
        expect(normalizeItemStatus('   ')).toBeUndefined()
        expect(normalizeItemStatus(null)).toBeUndefined()
    })

    test('falls back to in_progress for unknown statuses (never a terminal state)', () => {
        expect(normalizeItemStatus('some-future-status')).toBe('in_progress')
    })

    test('exact-match only: substring look-alikes do not match a real status', () => {
        // These would have been false positives under substring matching; the exact-match map keeps
        // them as unknown -> in_progress (non-terminal) instead.
        expect(normalizeItemStatus('reorder')).toBe('in_progress')
        expect(normalizeItemStatus('preorder')).toBe('in_progress')
        expect(normalizeItemStatus('worship')).toBe('in_progress')
        expect(normalizeItemStatus('kinship')).toBe('in_progress')
    })
})

describe('getOrderDisplayStatus - matrix rows', () => {
    test('all items ordered -> ORDERED', () => {
        expect(getOrderDisplayStatus(orderWithItemStatuses(['Ordered', 'Created', 'new']))).toBe(
            ORDER_DISPLAY_STATUS.ORDERED
        )
    })

    test('all items allocated/in progress -> IN_PROGRESS', () => {
        expect(
            getOrderDisplayStatus(orderWithItemStatuses(['allocated', 'allocated', 'Processing']))
        ).toBe(ORDER_DISPLAY_STATUS.IN_PROGRESS)
    })

    test('mix of ordered and allocated -> IN_PROGRESS', () => {
        expect(getOrderDisplayStatus(orderWithItemStatuses(['Ordered', 'allocated']))).toBe(
            ORDER_DISPLAY_STATUS.IN_PROGRESS
        )
    })

    test('some allocated + some shipped -> PARTIALLY_SHIPPED', () => {
        expect(getOrderDisplayStatus(orderWithItemStatuses(['allocated', 'SHIPPED']))).toBe(
            ORDER_DISPLAY_STATUS.PARTIALLY_SHIPPED
        )
    })

    test('all items shipped -> SHIPPED', () => {
        expect(getOrderDisplayStatus(orderWithItemStatuses(['SHIPPED', 'SHIPPED']))).toBe(
            ORDER_DISPLAY_STATUS.SHIPPED
        )
    })

    test('some shipped + some delivered -> PART_ORDER_DELIVERED', () => {
        expect(getOrderDisplayStatus(orderWithItemStatuses(['SHIPPED', 'Delivered']))).toBe(
            ORDER_DISPLAY_STATUS.PART_ORDER_DELIVERED
        )
    })

    test('delivered mixed with not-yet-shipped -> PART_ORDER_DELIVERED', () => {
        expect(getOrderDisplayStatus(orderWithItemStatuses(['Delivered', 'allocated']))).toBe(
            ORDER_DISPLAY_STATUS.PART_ORDER_DELIVERED
        )
    })

    test('all delivered -> DELIVERED', () => {
        expect(getOrderDisplayStatus(orderWithItemStatuses(['Delivered', 'Delivered']))).toBe(
            ORDER_DISPLAY_STATUS.DELIVERED
        )
    })

    test('all cancelled -> CANCELLED (the reported bug)', () => {
        expect(getOrderDisplayStatus(orderWithItemStatuses(['canceled', 'canceled']))).toBe(
            ORDER_DISPLAY_STATUS.CANCELLED
        )
    })

    test('all return initiated -> RETURN_INITIATED', () => {
        expect(
            getOrderDisplayStatus(orderWithItemStatuses(['Return Initiated', 'Return Initiated']))
        ).toBe(ORDER_DISPLAY_STATUS.RETURN_INITIATED)
    })

    test('some return initiated -> PARTIAL_RETURN_INITIATED', () => {
        expect(
            getOrderDisplayStatus(orderWithItemStatuses(['Return Initiated', 'Delivered']))
        ).toBe(ORDER_DISPLAY_STATUS.PARTIAL_RETURN_INITIATED)
    })

    test('all returned -> RETURN_COMPLETE', () => {
        expect(getOrderDisplayStatus(orderWithItemStatuses(['Returned', 'Returned']))).toBe(
            ORDER_DISPLAY_STATUS.RETURN_COMPLETE
        )
    })

    test('some returned (rest delivered) -> PARTIAL_RETURN_COMPLETE', () => {
        expect(getOrderDisplayStatus(orderWithItemStatuses(['Returned', 'Delivered']))).toBe(
            ORDER_DISPLAY_STATUS.PARTIAL_RETURN_COMPLETE
        )
    })

    test('returned mixed with return-initiated -> PARTIAL_RETURN_INITIATED', () => {
        expect(getOrderDisplayStatus(orderWithItemStatuses(['Returned', 'Return Initiated']))).toBe(
            ORDER_DISPLAY_STATUS.PARTIAL_RETURN_INITIATED
        )
    })

    test('partial cancellation is NOT treated as a cancelled order', () => {
        // Only a full cancellation maps to CANCELLED. A cancelled item is terminally removed from the
        // order, so with one item cancelled and one shipped the order reads as SHIPPED (every
        // remaining active item is shipped), not hidden behind the cancelled item.
        expect(getOrderDisplayStatus(orderWithItemStatuses(['canceled', 'SHIPPED']))).toBe(
            ORDER_DISPLAY_STATUS.SHIPPED
        )
    })

    test('cancelled items are excluded so the active items drive the status', () => {
        // The only non-cancelled item is fully returned, so the order is RETURN_COMPLETE — the
        // cancelled items must not drag it down to a partial state.
        expect(
            getOrderDisplayStatus(orderWithItemStatuses(['canceled', 'canceled', 'Returned']))
        ).toBe(ORDER_DISPLAY_STATUS.RETURN_COMPLETE)
        expect(getOrderDisplayStatus(orderWithItemStatuses(['canceled', 'Delivered']))).toBe(
            ORDER_DISPLAY_STATUS.DELIVERED
        )
    })
})

describe('getOrderDisplayStatus - partial / missing item statuses', () => {
    test('a delivered item alongside a status-less item is PART_ORDER_DELIVERED, not DELIVERED', () => {
        // The status-less item must keep the order out of the terminal "all delivered" state.
        expect(getOrderDisplayStatus(orderWithItemStatuses(['Delivered', null]))).toBe(
            ORDER_DISPLAY_STATUS.PART_ORDER_DELIVERED
        )
    })

    test('a shipped item alongside a status-less item is PARTIALLY_SHIPPED, not SHIPPED', () => {
        expect(getOrderDisplayStatus(orderWithItemStatuses(['SHIPPED', null]))).toBe(
            ORDER_DISPLAY_STATUS.PARTIALLY_SHIPPED
        )
    })

    test('an ordered item alongside a status-less item reads as IN_PROGRESS', () => {
        // An unresolved active item is non-terminal; pairing it with an ordered item is safest read
        // as in progress rather than the terminal-ish "all ordered" state.
        expect(getOrderDisplayStatus(orderWithItemStatuses(['Ordered', null]))).toBe(
            ORDER_DISPLAY_STATUS.IN_PROGRESS
        )
    })

    test('non-string item status is ignored (treated as missing)', () => {
        const order = {
            orderNo: 'x',
            productItems: [
                {productId: 'a', omsData: {status: 42}},
                {productId: 'b', omsData: {status: 'SHIPPED'}}
            ]
        }
        // The numeric status is unusable; the only resolvable item is shipped, but the unusable item
        // keeps it partial.
        expect(getOrderDisplayStatus(order)).toBe(ORDER_DISPLAY_STATUS.PARTIALLY_SHIPPED)
    })
})

describe('getOrderDisplayStatus - per-unit quantity breakdown', () => {
    // A line item with quantityOrdered > 1 can straddle several states at once. The display status
    // must reflect every unit's state, not just the line's `status` string (which only describes the
    // units not in a cancel/return flow). OMS sends quantities as JSON doubles (e.g. 2.0).

    test('the reported bug: 1 of 2 units returned, 1 still fulfilled -> PARTIAL_RETURN_COMPLETE', () => {
        // Real order 00002102: the line status is "fulfilled" and the old logic badged the whole
        // order IN_PROGRESS, ignoring that 1 unit was already returned.
        const order = {
            orderNo: '00002102',
            productItems: [
                {
                    productId: 'p1',
                    quantity: 2,
                    omsData: {
                        status: 'fulfilled',
                        quantityOrdered: 2.0,
                        quantityCanceled: 0.0,
                        quantityReturned: 1.0,
                        quantityReturnInitiated: 1.0,
                        quantityAvailableToReturn: 1.0,
                        quantityAvailableToCancel: 0.0
                    }
                }
            ]
        }
        // 1 unit RETURNED + 1 unit IN_PROGRESS (fulfilled) -> a partial-complete return.
        expect(getOrderDisplayStatus(order)).toBe(ORDER_DISPLAY_STATUS.PARTIAL_RETURN_COMPLETE)
    })

    test('1 of 2 units return-initiated (in flight), 1 still fulfilled -> PARTIAL_RETURN_INITIATED', () => {
        // quantityReturnInitiated is cumulative; with returned=0 the initiated unit is still in flight.
        const order = {
            orderNo: 'p',
            productItems: [
                {
                    productId: 'p1',
                    quantity: 2,
                    omsData: {
                        status: 'fulfilled',
                        quantityOrdered: 2.0,
                        quantityCanceled: 0.0,
                        quantityReturned: 0.0,
                        quantityReturnInitiated: 1.0
                    }
                }
            ]
        }
        expect(getOrderDisplayStatus(order)).toBe(ORDER_DISPLAY_STATUS.PARTIAL_RETURN_INITIATED)
    })

    test('both units of a single line fully returned -> RETURN_COMPLETE', () => {
        const order = {
            orderNo: 'p',
            productItems: [
                {
                    productId: 'p1',
                    quantity: 2,
                    omsData: {
                        status: 'fulfilled',
                        quantityOrdered: 2.0,
                        quantityCanceled: 0.0,
                        quantityReturned: 2.0,
                        quantityReturnInitiated: 2.0
                    }
                }
            ]
        }
        expect(getOrderDisplayStatus(order)).toBe(ORDER_DISPLAY_STATUS.RETURN_COMPLETE)
    })

    test('1 of 2 units cancelled, 1 still fulfilled -> IN_PROGRESS (cancelled unit excluded)', () => {
        const order = {
            orderNo: 'p',
            productItems: [
                {
                    productId: 'p1',
                    quantity: 2,
                    omsData: {
                        status: 'fulfilled',
                        quantityOrdered: 2.0,
                        quantityCanceled: 1.0,
                        quantityReturned: 0.0,
                        quantityReturnInitiated: 0.0
                    }
                }
            ]
        }
        // The cancelled unit is terminally removed; the remaining fulfilled unit drives the status.
        expect(getOrderDisplayStatus(order)).toBe(ORDER_DISPLAY_STATUS.IN_PROGRESS)
    })

    test('all units across the line cancelled -> CANCELLED', () => {
        const order = {
            orderNo: 'p',
            productItems: [
                {
                    productId: 'p1',
                    quantity: 2,
                    omsData: {
                        status: 'fulfilled',
                        quantityOrdered: 2.0,
                        quantityCanceled: 2.0,
                        quantityReturned: 0.0,
                        quantityReturnInitiated: 0.0
                    }
                }
            ]
        }
        expect(getOrderDisplayStatus(order)).toBe(ORDER_DISPLAY_STATUS.CANCELLED)
    })

    test('units split across two lines: one delivered, one partially returned -> PARTIAL_RETURN_COMPLETE', () => {
        const order = {
            orderNo: 'p',
            productItems: [
                {
                    productId: 'p1',
                    quantity: 1,
                    omsData: {
                        status: 'delivered',
                        quantityOrdered: 1.0,
                        quantityCanceled: 0.0,
                        quantityReturned: 0.0,
                        quantityReturnInitiated: 0.0
                    }
                },
                {
                    productId: 'p2',
                    quantity: 2,
                    omsData: {
                        status: 'fulfilled',
                        quantityOrdered: 2.0,
                        quantityCanceled: 0.0,
                        quantityReturned: 1.0,
                        quantityReturnInitiated: 1.0
                    }
                }
            ]
        }
        // Units: [delivered] + [returned, in_progress]. A returned unit mixed with non-returned
        // units that are not in flight -> partial return complete.
        expect(getOrderDisplayStatus(order)).toBe(ORDER_DISPLAY_STATUS.PARTIAL_RETURN_COMPLETE)
    })

    test('falls back to one bucket per line when no quantity breakdown is present', () => {
        // Status-only items (no quantityOrdered) must keep the original line-level behavior.
        expect(getOrderDisplayStatus(orderWithItemStatuses(['SHIPPED', 'Delivered']))).toBe(
            ORDER_DISPLAY_STATUS.PART_ORDER_DELIVERED
        )
    })
})

describe('getOrderDisplayStatus - fallback', () => {
    test('returns null when no productItems', () => {
        expect(getOrderDisplayStatus({orderNo: 'x'})).toBeNull()
        expect(getOrderDisplayStatus({orderNo: 'x', productItems: []})).toBeNull()
    })

    test('returns null when items have no omsData.status', () => {
        expect(
            getOrderDisplayStatus({
                orderNo: 'x',
                productItems: [{productId: 'a', quantity: 1}]
            })
        ).toBeNull()
    })

    test('returns null when omsData is present but the status key is absent', () => {
        expect(
            getOrderDisplayStatus({
                orderNo: 'x',
                productItems: [{productId: 'a', quantity: 1, omsData: {}}]
            })
        ).toBeNull()
    })

    test('handles undefined order', () => {
        expect(getOrderDisplayStatus(undefined)).toBeNull()
    })
})
