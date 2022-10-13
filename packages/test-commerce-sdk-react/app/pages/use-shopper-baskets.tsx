/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {UseBasket} from '../components/use-shopper-baskets/use-basket'
import {UsePaymentMethodsForBasket} from '../components/use-shopper-baskets/use-payment-method-for-basket'
import { UseShippingMethodsForShipment } from '../components/use-shopper-baskets/use-shipping-methods-for-shipment'
import { UseTaxesFromBasket } from '../components/use-shopper-baskets/use-taxes-from-basket'

function UseShopperBaskets() {
    return (
        <>
            <UseBasket basketId="123" />
            <hr />
            <UsePaymentMethodsForBasket basketId="123" />
            <hr />
            <UseShippingMethodsForShipment basketId='123' shipmentId='ship123' />
            <hr />
            <UseTaxesFromBasket basketId='123' />
        </>
    )
}

UseShopperBaskets.getTemplateName = () => 'UseShopperBaskets'

export default UseShopperBaskets
