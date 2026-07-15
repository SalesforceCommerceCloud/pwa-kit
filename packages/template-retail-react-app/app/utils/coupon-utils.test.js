/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    isCouponApplied,
    findAddedCoupon,
    wasCouponApplied
} from '@salesforce/retail-react-app/app/utils/coupon-utils'

describe('coupon-utils', () => {
    describe('isCouponApplied', () => {
        test.each(['applied', 'adhoc'])('treats %s as applied', (statusCode) => {
            expect(isCouponApplied({statusCode})).toBe(true)
        })

        test.each([
            'no_applicable_promotion',
            'no_active_promotion',
            'coupon_code_unknown',
            'coupon_disabled',
            'coupon_already_in_basket',
            'coupon_code_already_in_basket',
            'coupon_code_already_redeemed',
            'redemption_limit_exceeded',
            'customer_redemption_limit_exceeded',
            'timeframe_redemption_limit_exceeded'
        ])('treats %s as not applied', (statusCode) => {
            expect(isCouponApplied({statusCode})).toBe(false)
        })

        test('treats a missing statusCode as not applied', () => {
            expect(isCouponApplied({})).toBe(false)
        })

        test('treats a null/undefined item as not applied', () => {
            expect(isCouponApplied(null)).toBe(false)
            expect(isCouponApplied(undefined)).toBe(false)
        })
    })

    describe('findAddedCoupon', () => {
        test('finds the newly-added coupon when the basket started empty', () => {
            const prior = {couponItems: []}
            const updated = {couponItems: [{couponItemId: 'a', code: 'new', statusCode: 'applied'}]}
            expect(findAddedCoupon(prior, updated)).toEqual({
                couponItemId: 'a',
                code: 'new',
                statusCode: 'applied'
            })
        })

        test('finds the added coupon by couponItemId diff when others already exist', () => {
            const existing = {couponItemId: 'existing', code: 'old', statusCode: 'applied'}
            const prior = {couponItems: [existing]}
            const updated = {
                couponItems: [
                    existing,
                    {couponItemId: 'added', code: 'new', statusCode: 'no_applicable_promotion'}
                ]
            }
            expect(findAddedCoupon(prior, updated)).toEqual({
                couponItemId: 'added',
                code: 'new',
                statusCode: 'no_applicable_promotion'
            })
        })

        test('returns undefined when re-applying a code already on the basket (no new item)', () => {
            const existing = {couponItemId: 'existing', code: 'menssuits', statusCode: 'applied'}
            const prior = {couponItems: [existing]}
            const updated = {couponItems: [existing]}
            expect(findAddedCoupon(prior, updated)).toBeUndefined()
        })

        test('tolerates missing/undefined baskets and couponItems', () => {
            expect(findAddedCoupon(undefined, undefined)).toBeUndefined()
            expect(findAddedCoupon({}, {})).toBeUndefined()
            expect(
                findAddedCoupon(undefined, {
                    couponItems: [{couponItemId: 'a', statusCode: 'applied'}]
                })
            ).toEqual({couponItemId: 'a', statusCode: 'applied'})
        })
    })

    describe('wasCouponApplied', () => {
        test('true when the added coupon actually applied', () => {
            const prior = {couponItems: []}
            const updated = {couponItems: [{couponItemId: 'a', statusCode: 'applied'}]}
            expect(wasCouponApplied(prior, updated)).toBe(true)
        })

        test('false when the added coupon is parked (no_applicable_promotion)', () => {
            const prior = {couponItems: []}
            const updated = {
                couponItems: [
                    {couponItemId: 'a', statusCode: 'no_applicable_promotion', valid: true}
                ]
            }
            expect(wasCouponApplied(prior, updated)).toBe(false)
        })

        test('false when re-applying an already-applied code adds no new item', () => {
            // The pre-existing applied coupon must NOT be mistaken for the result
            // of this call — no new couponItemId means nothing was newly applied.
            const existing = {couponItemId: 'existing', code: 'menssuits', statusCode: 'applied'}
            const prior = {couponItems: [existing]}
            const updated = {couponItems: [existing]}
            expect(wasCouponApplied(prior, updated)).toBe(false)
        })

        test('true for a newly-applied coupon even when a parked coupon already existed', () => {
            const parked = {couponItemId: 'parked', statusCode: 'no_applicable_promotion'}
            const prior = {couponItems: [parked]}
            const updated = {
                couponItems: [parked, {couponItemId: 'added', statusCode: 'applied'}]
            }
            expect(wasCouponApplied(prior, updated)).toBe(true)
        })
    })
})
