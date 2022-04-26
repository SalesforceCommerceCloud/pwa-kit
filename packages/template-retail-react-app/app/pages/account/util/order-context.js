/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useCallback, useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import useCustomer from '../../../commerce-api/hooks/useCustomer'

const AccountOrdersContext = React.createContext()

export const AccountOrdersProvider = ({children}) => {
    const mounted = useRef()
    const customer = useCustomer()

    const [state, setState] = useState({
        orderIdsByOffset: {},
        ordersById: {},
        paging: {limit: 10, offset: 0, total: 0},
        productsById: {},
        isLoading: true
    })

    const mergeState = useCallback((data) => {
        // If we become unmounted during an async call that results in updating state, we
        // skip the update to avoid React errors about setting state in unmounted components.
        if (!mounted.current) {
            return
        }
        setState((_state) => ({
            ..._state,
            ...data
        }))
    })

    const fetchOrders = async ({offset = 0, limit = 10}) => {
        const orderIds = state.orderIdsByOffset[offset]
        let orders = orderIds?.map((id) => state.ordersById[id])

        if (!orderIds) {
            mergeState({isLoading: true})

            const {data = [], ...paging} = await customer.getCustomerOrders({
                offset,
                limit
            })

            orders = data

            mergeState({
                orderIdsByOffset: {
                    ...state.orderIdsByOffset,
                    [offset]: data.map((order) => order.orderNo)
                },
                ordersById: {
                    ...state.ordersById,
                    ...data?.reduce((acc, order) => {
                        return {...acc, [order.orderNo]: order}
                    }, {})
                },
                paging,
                isLoading: false
            })
        }

        if (orders) {
            let result = {}
            for (let order of orders) {
                const ids = order.productItems
                    .map((item) => item.productId)
                    .filter((id) => !result[id] && !state.productsById[id])
                if (ids.length < 1) {
                    continue
                }
                const productMap = await customer.getCustomerOrderProductsDetail(ids)
                result = {...result, ...productMap}
            }
            setState((state) => ({...state, productsById: {...state.productsById, ...result}}))
        }
    }

    const fetchOrder = async (orderNo) => {
        let order = state.ordersById[orderNo]

        if (!order) {
            mergeState({isLoading: true})
            order = await customer.getOrder(orderNo)
            mergeState({
                ordersById: {...state.ordersById, [order.orderNo]: order},
                isLoading: false
            })
        }

        const ids = order.productItems
            .map((item) => item.productId)
            .filter((id) => !state.productsById[id])

        if (ids.length > 0) {
            const productMap = await customer.getCustomerOrderProductsDetail(ids)
            mergeState({productsById: {...state.productsById, ...productMap}})
        }
    }

    // We use this to track mounted state.
    useEffect(() => {
        mounted.current = true
        return () => {
            mounted.current = false
        }
    }, [])

    const ctx = React.useMemo(() => {
        return {
            ...state,
            fetchOrders,
            fetchOrder
        }
    }, [state, customer, mergeState])

    return <AccountOrdersContext.Provider value={ctx}>{children}</AccountOrdersContext.Provider>
}

AccountOrdersProvider.propTypes = {
    children: PropTypes.any
}

/**
 * A hook for managing account order history state
 * @returns {Object} Data and actions
 */
export const useAccountOrders = () => {
    return React.useContext(AccountOrdersContext)
}
