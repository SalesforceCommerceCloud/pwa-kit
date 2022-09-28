/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import Json from '../components/Json'
import {Link} from 'react-router-dom'
import UseBasket from '../components/use-shopper-baskets/use-basket'

const basketId = '123'

function UseShopperBaskets() {
    return (
        <>
            <UseBasket />
            <hr />
        </>
    )
}

UseShopperBaskets.getTemplateName = () => 'UseShopperBaskets'

export default UseShopperBaskets
