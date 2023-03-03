/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useContext} from 'react'
import {useCurrentCustomer} from '../hooks/use-current-customer'
import PropTypes from 'prop-types'
import {CustomerProductListsContext} from './index'
import {useCustomerProductLists, useShopperCustomersMutation} from 'commerce-sdk-react-preview'

export const CustomerProductListsProvider = ({children}) => {
    const {data: customer} = useCurrentCustomer()
    const {isRegistered, customerId} = customer
    const createCustomerProductList = useShopperCustomersMutation('createCustomerProductList')
    const {data: productLists, ...restOfQuery} = useCustomerProductLists(
        {
            parameters: {customerId}
        },
        {
            onError: (e) => {
                console.error('e', e)
            },
            onSuccess: (data) => {
                if (!data.total) {
                    createCustomerProductList.mutate({
                        parameters: {customerId},
                        // we only use one type of product list for now
                        body: {type: 'wish_list'}
                    })
                }
            },
            // only registered user can have product lists
            enabled: isRegistered
        }
    )
    const value = {
        productLists,
        ...restOfQuery
    }
    return (
        <CustomerProductListsContext.Provider value={value}>
            {children}
        </CustomerProductListsContext.Provider>
    )
}

CustomerProductListsProvider.propTypes = {
    children: PropTypes.node.isRequired
}

export const useProductLists = () => {
    const context = useContext(CustomerProductListsContext)

    if (context === undefined) {
        throw new Error('useProductLists must be used within CustomerProductListsProvider')
    }
    return context
}
