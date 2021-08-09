/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

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
