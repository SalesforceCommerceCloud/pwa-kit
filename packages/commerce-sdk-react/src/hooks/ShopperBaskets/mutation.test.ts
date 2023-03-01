/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {act} from '@testing-library/react'
import nock from 'nock'
import {
    assertInvalidateQuery,
    assertRemoveQuery,
    assertUpdateQuery,
    DEFAULT_TEST_HOST,
    mockMutationEndpoints,
    renderHookWithProviders
} from '../../test-utils'
import {
    getCacheUpdateMatrix,
    ShopperBasketsMutationType,
    useShopperBasketsMutation
} from './mutation'
import {useBasket} from './query'
import {useCustomerBaskets} from '../ShopperCustomers'
import {CacheUpdateMatrixElement} from '../utils'

const CUSTOMER_ID = 'CUSTOMER_ID'
const BASKET_ID = 'BASKET_ID'
const COUPON_ID = 'COUPON_ID'
const PRODUCT_ID = 'PRODUCT_ID'
const ITEM_ID = 'ITEM_ID'
const PAYMENT_INSTRUMENT_ID = 'PAYMENT_INSTRUMENT_ID'
const SHIPMENT_ID = 'SHIPMENT_ID'

jest.mock('../../auth/index.ts', () => {
    return jest.fn().mockImplementation(() => ({
        ready: jest.fn().mockResolvedValue({access_token: '123'})
    }))
})

jest.mock('../useCustomerId.ts', () => {
    return jest.fn().mockReturnValue(CUSTOMER_ID)
})

type MutationPayloads = {
    [key in ShopperBasketsMutationType]?: {body: any; parameters: any}
}
const mutationPayloads: MutationPayloads = {
    updateBasket: {
        parameters: {basketId: BASKET_ID},
        body: {}
    },
    updateBillingAddressForBasket: {
        parameters: {basketId: BASKET_ID},
        body: {}
    },
    deleteBasket: {
        parameters: {basketId: BASKET_ID},
        body: {}
    },
    addCouponToBasket: {
        parameters: {basketId: BASKET_ID},
        body: {code: COUPON_ID}
    },
    addItemToBasket: {
        parameters: {basketId: BASKET_ID},
        body: {productId: PRODUCT_ID}
    },
    removeItemFromBasket: {
        parameters: {basketId: BASKET_ID, itemId: ITEM_ID},
        body: {}
    },
    addPaymentInstrumentToBasket: {
        parameters: {basketId: BASKET_ID},
        body: {paymentInstrumentId: PAYMENT_INSTRUMENT_ID}
    },
    createBasket: {
        parameters: {},
        body: {}
    },
    mergeBasket: {
        parameters: {},
        body: {}
    },
    removeCouponFromBasket: {
        parameters: {basketId: BASKET_ID, couponItemId: COUPON_ID},
        body: {}
    },
    removePaymentInstrumentFromBasket: {
        parameters: {basketId: BASKET_ID, paymentInstrumentId: PAYMENT_INSTRUMENT_ID},
        body: {}
    },
    updateCustomerForBasket: {
        parameters: {basketId: BASKET_ID},
        body: {email: 'alex@test.com'}
    },
    updateItemInBasket: {
        parameters: {basketId: BASKET_ID, itemId: ITEM_ID},
        body: {}
    },
    updatePaymentInstrumentInBasket: {
        parameters: {basketId: BASKET_ID, paymentInstrumentId: PAYMENT_INSTRUMENT_ID},
        body: {}
    },
    updateShippingAddressForShipment: {
        parameters: {basketId: BASKET_ID, shipmentId: SHIPMENT_ID},
        body: {}
    },
    updateShippingMethodForShipment: {
        parameters: {basketId: BASKET_ID, shipmentId: SHIPMENT_ID},
        body: {id: '001'}
    }
}
const oldCustomerBaskets = {
    total: 1,
    baskets: [{basketId: BASKET_ID, hello: 'world'}]
}

const newCustomerBaskets = {
    total: 1,
    baskets: [{basketId: BASKET_ID, hello: 'world_modified'}]
}

const oldBasket = {
    basketId: BASKET_ID,
    hello: 'world'
}

const newBasket = {
    basketId: BASKET_ID,
    hello: 'world_modified'
}
const tests = (Object.keys(mutationPayloads) as ShopperBasketsMutationType[]).map(
    (mutationName) => {
        const payload = mutationPayloads[mutationName]

        return {
            hook: mutationName,
            cases: [
                {
                    name: 'success',
                    assertions: async () => {
                        mockMutationEndpoints(
                            '/checkout/shopper-baskets/',
                            {errorResponse: 200},
                            newBasket
                        )
                        mockRelatedQueries()

                        const {result, waitForValueToChange} = renderHookWithProviders(() => {
                            const action = mutationName as ShopperBasketsMutationType
                            const mutation = useShopperBasketsMutation({action})

                            // All of the necessary query hooks needed to verify the cache-update logic
                            const queries = {
                                basket: useBasket({basketId: BASKET_ID}),
                                customerBaskets: useCustomerBaskets({customerId: CUSTOMER_ID})
                            }

                            return {
                                queries,
                                mutation
                            }
                        })

                        await waitForValueToChange(() => result.current.queries.basket.data)

                        act(() => {
                            result.current.mutation.mutate(payload)
                        })

                        await waitForValueToChange(() => result.current.mutation.isSuccess)
                        expect(result.current.mutation.isSuccess).toBe(true)
                        // On successful mutation, the query cache gets updated too. Let's assert it.
                        const cacheUpdateMatrix = getCacheUpdateMatrix(CUSTOMER_ID)
                        // @ts-ignore
                        const matrixElement = cacheUpdateMatrix[mutationName](payload, {})
                        const {invalidate, update, remove}: CacheUpdateMatrixElement = matrixElement

                        const assertionData = {
                            basket: newBasket,
                            customerBaskets: newCustomerBaskets
                        }
                        update?.forEach(({name}) => {
                            // @ts-ignore
                            assertUpdateQuery(result.current.queries[name], assertionData[name])
                        })

                        invalidate?.forEach(({name}) => {
                            // @ts-ignore
                            assertInvalidateQuery(result.current.queries[name], oldCustomerBaskets)
                        })

                        remove?.forEach(({name}) => {
                            // @ts-ignore
                            assertRemoveQuery(result.current.queries[name])
                        })
                    }
                },
                {
                    name: 'error',
                    assertions: async () => {
                        mockMutationEndpoints('/checkout/shopper-baskets/', {errorResponse: 500})

                        const {result, waitForNextUpdate} = renderHookWithProviders(() => {
                            const action = mutationName as ShopperBasketsMutationType
                            return useShopperBasketsMutation({action})
                        })

                        act(() => {
                            result.current.mutate(payload)
                        })

                        await waitForNextUpdate()

                        expect(result.current.error).toBeDefined()
                    }
                }
            ]
        }
    }
)

tests.forEach(({hook, cases}) => {
    describe(hook, () => {
        beforeEach(() => {
            jest.clearAllMocks()
        })
        cases.forEach(({name, assertions}) => {
            test(name, assertions)
        })
    })
})

const mockRelatedQueries = () => {
    const basketEndpoint = '/checkout/shopper-baskets/'
    const customerEndpoint = '/customer/shopper-customers/'

    // The queries would initially respond with 'old data'.
    // And then subsequent responses would have 'new data' because of the cache updates.

    // For get basket
    nock(DEFAULT_TEST_HOST)
        .get((uri) => {
            return uri.includes(basketEndpoint)
        })
        .reply(200, oldBasket)
    nock(DEFAULT_TEST_HOST)
        .persist()
        .get((uri) => {
            return uri.includes(basketEndpoint)
        })
        .reply(200, newBasket)

    // For get customer basket
    nock(DEFAULT_TEST_HOST)
        .get((uri) => {
            return uri.includes(customerEndpoint)
        })
        .reply(200, oldCustomerBaskets)
    nock(DEFAULT_TEST_HOST)
        .persist()
        .get((uri) => {
            return uri.includes(customerEndpoint)
        })
        .reply(200, newCustomerBaskets)
}
