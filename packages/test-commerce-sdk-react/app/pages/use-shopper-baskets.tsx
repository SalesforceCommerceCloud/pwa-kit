/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useShopperBasketsMutation} from 'commerce-sdk-react'
import Json from '../components/Json'

const UseShopperBaskets = () => {
    const createBasket = useShopperBasketsMutation('createBasket')
    return (
        <>
            <h1>ShopperBaskets</h1>
            <div>Click the button to create a basket</div>
            <button onClick={() => createBasket.mutate({body: {}})}>createBasket</button>
            <hr />
            <div>
                <Json data={createBasket} />
            </div>
        </>
    )
}

UseShopperBaskets.getTemplateName = () => 'UseShopperBaskets'

export default UseShopperBaskets
