/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    createCommerceClientCart,
    CART_PRODUCTS,
    mapBasketToWidgetCart,
    normalizeCartTransport,
    normalizeCartPageUrl
} from '@salesforce/retail-react-app/app/utils/commerce-client-cart'

const deferred = () => {
    let resolve, reject
    const promise = new Promise((yes, no) => {
        resolve = yes
        reject = no
    })
    return {promise, resolve, reject}
}
const basket = (quantity = 1) => ({
    basketId: 'basket',
    currency: 'USD',
    productSubTotal: 10 * quantity,
    orderTotal: 10 * quantity,
    productItems: quantity
        ? [
              {
                  itemId: 'line',
                  productId: 'variant-blue-small',
                  productName: 'Shirt',
                  quantity,
                  basePrice: 10,
                  price: 10 * quantity
              }
          ]
        : []
})
const add = {action: 'add', productId: 'variant-blue-small', quantity: 3}
const setup = () => {
    let identity = 'shopper-a'
    const readBasket = jest.fn().mockResolvedValue(basket())
    const writeBasket = jest.fn().mockResolvedValue(basket(3))
    const publish = jest.fn((value) => mapBasketToWidgetCart(value))
    const clear = jest.fn()
    const adapter = createCommerceClientCart({
        getIdentity: () => identity,
        readBasket,
        writeBasket,
        publish,
        clear,
        timeoutMs: 50
    })
    return {
        adapter,
        readBasket,
        writeBasket,
        publish,
        clear,
        changeShopper: () => {
            identity = 'shopper-b'
            adapter.reset()
        }
    }
}

it('adds the selected variant and quantity once and returns an authoritative read', async () => {
    const state = setup()
    state.readBasket.mockResolvedValueOnce(basket()).mockResolvedValueOnce(basket(3))
    const result = await state.adapter.action(add)
    expect(state.writeBasket).toHaveBeenCalledTimes(1)
    expect(state.writeBasket).toHaveBeenCalledWith(add, basket(), 'shopper-a')
    expect(state.readBasket).toHaveBeenCalledTimes(2)
    expect(result).toMatchObject({
        ok: true,
        cart: {items: [{productId: add.productId, quantity: 3}]}
    })
})

it.each([
    {action: 'quantity', itemId: 'line', productId: 'variant-blue-small', quantity: 2},
    {action: 'remove', itemId: 'line', productId: 'variant-blue-small'},
    {action: 'coupon', code: 'SAVE'}
])('re-reads the basket after $action', async (request) => {
    const state = setup()
    expect(await state.adapter.action(request)).toMatchObject({ok: true})
    expect(state.writeBasket).toHaveBeenCalledWith(request, basket(), 'shopper-a')
    expect(state.readBasket).toHaveBeenCalledTimes(2)
})

it('View Cart reads live state without creating a basket or writing', async () => {
    const state = setup()
    state.readBasket.mockResolvedValue(null)
    expect(await state.adapter.action({action: 'get'})).toMatchObject({
        ok: true,
        cart: {items: [], expressPaymentUrl: null}
    })
    expect(state.writeBasket).not.toHaveBeenCalled()
})

it.each([0, -1, 1.2, NaN, '2'])(
    'rejects invalid add quantity %s before a write',
    async (quantity) => {
        const state = setup()
        expect(await state.adapter.action({...add, quantity})).toMatchObject({ok: false})
        expect(state.writeBasket).not.toHaveBeenCalled()
    }
)

it('rejects old or mismatched line ids', async () => {
    const state = setup()
    expect(
        await state.adapter.action({
            action: 'remove',
            itemId: 'old-line',
            productId: 'variant-blue-small'
        })
    ).toMatchObject({ok: false})
    expect(state.writeBasket).not.toHaveBeenCalled()
})

const scapiError = (status) => Object.assign(new Error('SCAPI error'), {response: {status}})

it.each([
    [400, 'This coupon code could not be applied'],
    [401, 'Your shopper session could not be verified'],
    [403, 'Your shopper session could not be verified'],
    [404, 'The basket or item is no longer available'],
    [422, 'This coupon code could not be applied']
])('leaves edits enabled after SCAPI rejects a write with %s', async (status, message) => {
    const state = setup()
    state.writeBasket.mockRejectedValueOnce(scapiError(status))
    expect(await state.adapter.action({action: 'coupon', code: 'INVALID'})).toMatchObject({
        ok: false,
        error: expect.stringContaining(message)
    })
    expect(await state.adapter.action({action: 'coupon', code: 'SAVE'})).toMatchObject({
        ok: true
    })
    expect(state.writeBasket).toHaveBeenCalledTimes(2)
})

it.each([408, 500])('keeps edits locked after an uncertain write response (%s)', async (status) => {
    const state = setup()
    state.writeBasket.mockRejectedValueOnce(scapiError(status))
    expect(await state.adapter.action(add)).toMatchObject({
        ok: false,
        error: expect.stringContaining('View Cart')
    })
    expect(await state.adapter.action(add)).toMatchObject({ok: false})
    expect(state.writeBasket).toHaveBeenCalledTimes(1)
})

it('never retries a write after a failed follow-up read; requires explicit View Cart recovery', async () => {
    const state = setup()
    state.readBasket.mockResolvedValueOnce(basket()).mockRejectedValueOnce(scapiError(400))
    expect(await state.adapter.action(add)).toMatchObject({
        ok: false,
        error: expect.stringContaining('View Cart')
    })
    expect(state.writeBasket).toHaveBeenCalledTimes(1)
    await state.adapter.refresh() // Background sync does not unlock edits.
    expect(await state.adapter.action(add)).toMatchObject({ok: false})
    expect(state.writeBasket).toHaveBeenCalledTimes(1)
    await state.adapter.action({action: 'get'})
    expect(await state.adapter.action(add)).toMatchObject({ok: true})
    expect(state.writeBasket).toHaveBeenCalledTimes(2)
})

it('blocks further writes when a mutation response is lost, even after a failed View Cart', async () => {
    const state = setup()
    state.writeBasket.mockRejectedValueOnce(new Error('connection lost'))
    await state.adapter.action(add)
    state.readBasket.mockRejectedValueOnce(new Error('offline'))
    expect(await state.adapter.action({action: 'get'})).toMatchObject({ok: false})
    expect(await state.adapter.action(add)).toMatchObject({ok: false})
    expect(state.writeBasket).toHaveBeenCalledTimes(1)
})

it('expires an in-flight write and ignores its late response without replaying it', async () => {
    jest.useFakeTimers()
    const state = setup()
    const write = deferred()
    state.writeBasket.mockReturnValueOnce(write.promise)
    const action = state.adapter.action(add)
    await jest.advanceTimersByTimeAsync(51)
    expect(await action).toMatchObject({ok: false})
    expect(await state.adapter.action(add)).toMatchObject({ok: false})
    // A read while the write is still in flight cannot lift the barrier.
    expect(await state.adapter.action({action: 'get'})).toMatchObject({ok: false})
    write.resolve(basket(3))
    await Promise.resolve()
    await Promise.resolve()
    expect(state.publish).not.toHaveBeenCalled()
    expect(state.writeBasket).toHaveBeenCalledTimes(1)
    expect(await state.adapter.action({action: 'get'})).toMatchObject({ok: true})
    jest.useRealTimers()
})

it('clears the widget and discards reads and queued writes from the previous shopper', async () => {
    const state = setup()
    const read = deferred()
    state.readBasket.mockReturnValueOnce(read.promise)
    const first = state.adapter.action({action: 'get'})
    await Promise.resolve()
    const queued = state.adapter.action(add)
    state.changeShopper()
    read.resolve(basket())
    expect(await first).toMatchObject({ok: false})
    expect(await queued).toMatchObject({ok: false})
    expect(state.clear).toHaveBeenCalled()
    expect(state.publish).not.toHaveBeenCalled()
    expect(state.writeBasket).not.toHaveBeenCalled()
    expect(await state.adapter.action({action: 'get'})).toMatchObject({ok: true})
})

it('discards a stale read after a storefront change and publishes the new authoritative cart', async () => {
    const state = setup()
    const old = deferred()
    state.readBasket.mockReturnValueOnce(old.promise).mockResolvedValueOnce(basket(5))
    const initial = state.adapter.action({action: 'get'})
    await Promise.resolve()
    const refresh = state.adapter.refresh()
    old.resolve(basket())
    expect(await initial).toMatchObject({ok: false})
    await refresh
    expect(state.publish).toHaveBeenCalledTimes(1)
    expect(state.publish).toHaveBeenCalledWith(basket(5), 'shopper-a')
})

it('does not publish a read that finishes after its deadline', async () => {
    jest.useFakeTimers()
    const state = setup()
    const read = deferred()
    state.readBasket.mockReturnValueOnce(read.promise)
    const result = state.adapter.action({action: 'get'})
    await jest.advanceTimersByTimeAsync(51)
    expect(await result).toMatchObject({ok: false})
    read.resolve(basket())
    await Promise.resolve()
    expect(state.publish).not.toHaveBeenCalled()
    jest.useRealTimers()
})

it.each(['direct', 'DIRECT', ' Direct '])('uses direct cart transport for %j', (value) => {
    expect(normalizeCartTransport(value)).toBe('direct')
})

it.each([undefined, null, true, 'invalid', '   '])(
    'falls back to agent cart transport for %j',
    (value) => {
        expect(normalizeCartTransport(value)).toBe('agent')
    }
)

it('validates optional iframe URLs', () => {
    expect(normalizeCartPageUrl('/cart?embedded=true')).toBe('/cart?embedded=true')
    expect(normalizeCartPageUrl('https://merchant.example/cart')).toBe(
        'https://merchant.example/cart'
    )
    for (const url of [
        'javascript:alert(1)',
        '//other.example',
        '/\\other.example',
        'https://user:pass@example.com',
        'http://other.example/cart'
    ])
        expect(normalizeCartPageUrl(url)).toBe('')
})

it('maps product images, selected variant labels, discounts and unformatted amounts', () => {
    const value = {
        ...basket(2),
        orderTotal: 18,
        taxTotal: 0,
        taxation: 'gross',
        couponItems: [
            {code: 'SAVE', couponItemId: 'coupon-1', statusCode: 'applied', valid: true},
            {code: 'MANUAL', couponItemId: 'coupon-2', statusCode: 'adhoc', valid: true},
            {
                code: 'LATER',
                couponItemId: 'coupon-3',
                statusCode: 'no_applicable_promotion',
                valid: true
            }
        ],
        orderPriceAdjustments: [{price: -2, itemText: 'Save two'}],
        [CART_PRODUCTS]: {
            'variant-blue-small': {
                imageGroups: [{viewType: 'small', images: [{link: '/shirt.jpg'}]}],
                variationValues: {color: 'blue'},
                variationAttributes: [
                    {id: 'color', name: 'Color', values: [{value: 'blue', name: 'Blue'}]}
                ]
            }
        }
    }
    expect(mapBasketToWidgetCart(value)).toMatchObject({
        total: 18,
        subtotal: 20,
        taxes: 0,
        taxationMode: 'gross',
        promotionsDiscount: 2,
        coupons: [
            {code: 'SAVE', id: 'coupon-1', status: 'applied'},
            {code: 'MANUAL', id: 'coupon-2', status: 'applied'},
            {code: 'LATER', id: 'coupon-3', status: 'no_applicable_promotion'}
        ],
        couponsApplied: [
            {code: 'SAVE', id: 'coupon-1', status: 'applied'},
            {code: 'MANUAL', id: 'coupon-2', status: 'applied'}
        ],
        items: [
            {
                imageUrl: '/shirt.jpg',
                itemSubtotal: 20,
                originalSubtotal: 20,
                variants: [{lbl: 'Color', type: 'color', value: 'Blue'}]
            }
        ]
    })
})
