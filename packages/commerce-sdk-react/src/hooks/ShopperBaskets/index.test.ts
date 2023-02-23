/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ShopperBaskets} from 'commerce-sdk-isomorphic'
import {getUnimplementedEndpoints} from '../../test-utils'
import {cacheUpdateMatrix} from './cache'
import * as queries from './query'

describe('Shopper Baskets hooks', () => {
    test('all endpoints have hooks', () => {
        const unimplemented = getUnimplementedEndpoints(ShopperBaskets, queries, cacheUpdateMatrix)
        expect(unimplemented).toEqual([
            'transferBasket',
            'addGiftCertificateItemToBasket',
            'removeGiftCertificateItemFromBasket',
            'updateGiftCertificateItemInBasket',
            'addTaxesForBasketItem',
            'addPriceBooksToBasket',
            'createShipmentForBasket',
            'removeShipmentFromBasket',
            'updateShipmentForBasket',
            'addTaxesForBasket'
        ])
    })
})
