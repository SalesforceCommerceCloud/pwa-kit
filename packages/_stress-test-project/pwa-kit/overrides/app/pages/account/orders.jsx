/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Route, Switch, useRouteMatch} from 'react-router'
import OrderHistory from './order-history'
import OrderDetail from './order-detail'
import {AccountOrdersProvider} from './util/order-context'

const AccountOrders = () => {
    const {path} = useRouteMatch()

    return (
        <AccountOrdersProvider>
            <Switch>
                <Route exact path={path}>
                    <OrderHistory />
                </Route>
                <Route exact path={`${path}/:orderNo`}>
                    <OrderDetail />
                </Route>
            </Switch>
        </AccountOrdersProvider>
    )
}

AccountOrders.getTemplateName = () => 'account-order-history'

export default AccountOrders
