/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Route, Routes, useMatch} from 'react-router'
import OrderHistory from './order-history'
import OrderDetail from './order-detail'

const AccountOrders = () => {
    const {path} = useMatch()

    return (
        <Routes>
            <Route path={path}>
                <OrderHistory />
            </Route>
            <Route path={`${path}/:orderNo`}>
                <OrderDetail />
            </Route>
        </Routes>
    )
}

AccountOrders.getTemplateName = () => 'account-order-history'

export default AccountOrders
