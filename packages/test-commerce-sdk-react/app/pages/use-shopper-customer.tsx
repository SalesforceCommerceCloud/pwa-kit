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
    useCustomerBaskets,
    useCustomerOrders,
    useCustomerProductList,
    useShopperCustomersMutation,
    useShopperLoginHelper
} from 'commerce-sdk-react'
import Json from '../components/Json'
import {useQueryClient} from '@tanstack/react-query'

const CUSTOMER_ID = 'abkehFwKoXkbcRmrFIlaYYwKtJ'
const ADDRESS_NAME = 'TestAddress'
const LIST_ID = '987ae461a7c6c5fd17006fc774'
const ITEM_ID = '500cebac3fe6e8aa67e22dca1a'
const PRODUCT_ID = '25518823M'
const RANDOM_STR = Math.random()
    .toString(36)
    .slice(2, 7)

const renderQueryHook = (name: string, {data, isLoading, error}: any) => {
    if (isLoading) {
        return (
            <div key={name}>
                <h1 id={name}>{name}</h1>
                <hr />
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }

    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }

    return (
        <div key={name}>
            <h2 id={name}>{name}</h2>
            <h3>{data?.name}</h3>
            <hr />
            <h3>Returning data</h3>
            <Json data={{isLoading, error, data}} />
        </div>
    )
}

const renderMutationHook = ({name, hook, body, parameters}: any) => {
    return (
        <div key={name}>
            <h2 id={name}>{name}</h2>
            <button
                onClick={() =>
                    hook.mutate({
                        body,
                        parameters
                    })
                }
            >
                {name}
            </button>

            {hook.error?.message && <p style={{color: 'red'}}>Error: {hook.error?.message}</p>}
            <hr />
            <div>
                <Json data={hook} />
            </div>
        </div>
    )
}

function UseCustomer() {
    const queryClient = useQueryClient()
    const loginRegisteredUser = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)
    const mutationHooks = [
        // {
        //     action: 'registerCustomer',
        //     body: {
        //         customer: {
        //             login: 'jsmith111@test111.com',
        //             email: 'jsmith111@test111.com',
        //             first_name: 'John111',
        //             last_name: 'Smith111'
        //         },
        //         password: 'Abcd!12345'
        //     },
        //     parameters: {}
        // },
        {
            action: 'updateCustomer',
            body: {firstName: `Kobe${RANDOM_STR}`},
            parameters: {customerId: CUSTOMER_ID}
        },
        {
            action: 'updateCustomerPassword',
            body: {currentPassword: 'Test12345!', password: 'Test1234!'},
            parameters: {customerId: CUSTOMER_ID}
        },
        // {
        //     action: 'getResetPasswordToken',
        //     body: {login: 'kobe@test.com'},
        //     parameters: {}
        // },
        {
            action: 'createCustomerAddress',
            body: {addressId: `TestAddress${RANDOM_STR}`, countryCode: 'CA', lastName: 'Murphy'},
            parameters: {customerId: CUSTOMER_ID}
        },
        {
            action: 'updateCustomerAddress',
            body: {addressId: 'TestAddress', countryCode: 'US', lastName: `Murphy${RANDOM_STR}`},
            parameters: {customerId: CUSTOMER_ID, addressName: ADDRESS_NAME}
        },
        {
            action: 'removeCustomerAddress',
            body: {},
            parameters: {customerId: CUSTOMER_ID, addressName: `TestAddress${RANDOM_STR}`}
        },
        {
            action: 'createCustomerProductList',
            body: {type: 'wish_list'},
            parameters: {customerId: CUSTOMER_ID}
        },
        {
            action: 'createCustomerProductListItem',
            body: {priority: 2, public: true, quantity: 3, type: 'product', productId: PRODUCT_ID},
            parameters: {customerId: CUSTOMER_ID, listId: LIST_ID}
        },
        {
            action: 'updateCustomerProductListItem',
            body: {priority: 2, public: true, quantity: 3},
            parameters: {customerId: CUSTOMER_ID, listId: LIST_ID, itemId: ITEM_ID}
        },
        {
            action: 'createCustomerPaymentInstrument',
            body: {
                bankRoutingNumber: 'AB1234',
                giftCertificateCode: 'gift-code',
                paymentCard: {
                    number: '4454852652415965',
                    validFromMonth: 12,
                    expirationYear: 2030,
                    expirationMonth: 12,
                    cardType: 'Visa',
                    holder: 'John Smith',
                    issueNumber: '92743928',
                    validFromYear: 22
                },
                paymentMethodId: 'Credit Card'
            },
            parameters: {customerId: CUSTOMER_ID}
        },
        {
            action: 'deleteCustomerPaymentInstrument',
            body: {},
            parameters: {customerId: CUSTOMER_ID, paymentInstrumentId: '812ad603d00ae6cdf0f80803ad'}
        }
    ].map(({action, body, parameters}) => {
        return {
            name: action,
            hook: useShopperCustomersMutation(action),
            body,
            parameters
        }
    })

    const queryHooks = [
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
        },
        {
            name: 'useCustomerBaskets',
            hook: useCustomerBaskets({customerId: CUSTOMER_ID})
        },
        {
            name: 'useCustomerProductList',
            hook: useCustomerProductList({customerId: CUSTOMER_ID, listId: LIST_ID})
        }
    ]

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
                <>
                    <div>
                        <h1>Mutation hooks</h1>
                        {mutationHooks.map((mutation) => {
                            return renderMutationHook({...mutation})
                        })}
                    </div>
                    <div>
                        <h1>Query hooks</h1>
                        {queryHooks.map(({name, hook}) => {
                            return renderQueryHook(name, {...hook})
                        })}
                    </div>
                </>
            )}
        </>
    )
}

UseCustomer.getTemplateName = () => 'UseCustomer'

export default UseCustomer
