/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import {useCommerceAPI} from '../../commerce-api/contexts'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import basketsReducer from '../reducers/baskets-reducer'

const basketsInitialState = {
    isLoading: false,
    error: false,
    data: [],
    total: 0
}
const BasketsContext = React.createContext()
const BasketsProvider = ({children}) => {
    // TODO: we should separate api into different apis context instead of having a combined api object here
    // for example: ShopperBasketAPI, ShopperCustomerAPI
    // expect to use const api = shopperBasketAPI()
    const api = useCommerceAPI()

    // slas hooks
    const shopper = useCustomer()
    // Create or restore the user session upon mounting
    // this flow should stay in shopper hook
    useEffect(() => {
        shopper.login()
    }, [])

    const [baskets, dispatch] = React.useReducer(basketsReducer, basketsInitialState)

    const value = React.useMemo(() => ({baskets, dispatch}), [baskets])

    const createBasket = async () => {
        dispatch({type: 'loading'})
        try {
            const res = await api.shopperBaskets.createBasket({})
            console.log('seting a basket====================')
            dispatch({type: 'set_basket', payload: res})
            return res
        } catch (err) {
            dispatch({type: 'error'})
            throw new Error(err)
        }
    }

    const getBaskets = async () => {
        dispatch({type: 'loading'})
        try {
            console.log('getting baskets---------------------------')
            console.log('api.shopperBaskets', api.shopperBaskets)
            const res = await api.shopperCustomers.getCustomerBaskets({
                parameters: {customerId: shopper?.customerId}
            })
            console.log('res', res)
            if (!res.total) {
                console.log('creating a basket ----------------------------')
                await createBasket()
            }

            console.log('setting baskets-------------------------')
            dispatch({type: 'set_baskets', payload: res})
        } catch (e) {
            console.log('basket error --------------------')
            console.log('e', e)
        }
    }

    const addItemToCart = async (item, basketId) => {
        console.log('add to cart loading ----')
        dispatch({type: 'loading'})
        try {
            console.log('adding-item to cart')
            const res = await api.shopperBaskets.addItemToBasket({
                body: item,
                parameters: {basketId}
            })
            console.log('res', res)
            dispatch({type: 'add_to_cart', payload: res})
        } catch (err) {
            dispatch({type: 'error'})
            throw new Error(err)
        }
    }

    // retrieve the baskets information on first render
    // if there is no basket, create one => can we delay this until someone adds an item to cart
    React.useEffect(() => {
        console.log('Initializing baskets =========================')
        // console.log('baskets', baskets)
        // console.log('shoppers', shopper)
        // console.log('>>>>>>')

        if (!baskets.data.length && shopper.isInitialized) {
            dispatch({type: 'loading'})
            try {
                console.log('getting and setting up basket>>>>>>>>>>>>>>>>>>>>>>')
                getBaskets(shopper.customerId)
            } catch (err) {
                dispatch({type: 'error'})
                throw new Error(err)
            }
        }
    }, [shopper.authType, baskets.total])

    // handle anything related to basket here
    return (
        <BasketsContext.Provider value={{...value, addItemToCart}}>
            {children}
        </BasketsContext.Provider>
    )
}

const useBaskets = () => {
    const context = React.useContext(BasketsContext)
    if (context === undefined) {
        throw new Error(`useUser must be used within a UserProvider`)
    }
    return context
}

export {useBaskets, BasketsProvider}
