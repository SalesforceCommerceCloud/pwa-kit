/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import OriginalCartTitle from '@salesforce/retail-react-app/app/pages/cart/partials/cart-title'
import AboveCartTitle from './cart-title-above'

const CartTitle = () => {
    return (
        <>
            <AboveCartTitle />
            <OriginalCartTitle />
        </>
    )
}

export default CartTitle
