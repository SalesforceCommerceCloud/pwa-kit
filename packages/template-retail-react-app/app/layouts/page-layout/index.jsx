/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

import {Route, Switch, useRouteMatch} from 'react-router'

import {Box, Stack} from '@chakra-ui/react'
import ProductDetail from '../../pages/product-detail'
import ProductList from '../../pages/product-list'


const PageLayout = ({children}) => {
    const {path} = useRouteMatch()

    return (
        <Box>
            {/* Page Header content*/}
            <header>Page Layout</header>
            <Stack>{children}</Stack>

            {/* Page Center content*/}
            <Switch>
                <Route exact path={`${path}/category/:categoryId'`}>
                    <ProductList />
                </Route>
                <Route exact path={`${path}/product/:productId`}>
                    <ProductDetail />
                </Route>
                {/* ... additional routes sharing the same base Page layout path /page */}
            </Switch>
        </Box>
    )
}


export default PageLayout
