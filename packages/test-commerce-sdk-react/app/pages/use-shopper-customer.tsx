/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {
    ShopperLoginHelpers,
    useCustomer,
    useCustomerAddress,
    useCustomerOrders,
    useShopperLoginHelper
} from 'commerce-sdk-react'
import Json from '../components/Json'
import {useQueryClient} from '@tanstack/react-query'

const CUSTOMER_ID = 'abkehFwKoXkbcRmrFIlaYYwKtJ'
const ADDRESS_NAME = 'TestAddress'

const renderHookResponse = (hookName: string, {data, isLoading, error}: any) => {
    if (isLoading) {
        return (
            <div key={hookName}>
                <h1 id={hookName}>{hookName}</h1>
                <hr />
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }

    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }

    return (
        <div key={hookName}>
            <h1 id={hookName}>{hookName}</h1>
            <h2>{data?.name}</h2>
            <hr />
            <h3>Returning data</h3>
            <Json data={{isLoading, error, data}} />
        </div>
    )
}

function UseCustomer() {
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)
    const useCustomerHooks = []
    const queryClient = useQueryClient()
    useCustomerHooks.push(
        {
            name: 'useCustomer',
            hook: useCustomer({customerId: CUSTOMER_ID})
        },
        {
            name: 'useCustomerAddress',
            hook: useCustomerAddress({
                customerId: CUSTOMER_ID,
                addressName: ADDRESS_NAME
            })
        },
        {
            name: 'useCustomerOrders',
            hook: useCustomerOrders({customerId: CUSTOMER_ID})
        }
    )

    return (
        <>
            <h1>ShopperCustomer page</h1>

            {!loginRegisteredUser?.isSuccess ? (
                <>
                    <button
                        onClick={() => {
                            queryClient.removeQueries([{entity: 'customer'}])

                            return loginRegisteredUser.mutate({
                                username: 'kobe@test.com',
                                password: 'Test1234!'
                            })
                        }}
                    >
                        loginRegisteredUser
                    </button>
                    {loginRegisteredUser.error?.message && (
                        <p style={{color: 'red'}}>Error: {loginRegisteredUser.error?.message}</p>
                    )}
                </>
            ) : (
                useCustomerHooks.map(({name, hook}) => {
                    return renderHookResponse(name, {...hook})
                })
            )}
        </>
    )
}

UseCustomer.getTemplateName = () => 'UseCustomer'

export default UseCustomer
