/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {
    AuthHelpers,
    useCustomer,
    useCustomerAddress,
    useCustomerBaskets,
    useCustomerOrders,
    useCustomerProductList,
    useCustomerProductLists,
    useShopperCustomersMutation,
    useAuthHelper,
    ShopperCustomersMutation
} from '@salesforce/commerce-sdk-react'
import Json from '../components/Json'
import {useQueryClient} from '@tanstack/react-query'

const CUSTOMER_ID = 'abkehFwKoXkbcRmrFIlaYYwKtJ'
const ADDRESS_NAME = 'TestAddress'
const LIST_ID = 'bcd08be6f883120b4960ca8a0b'
const ITEM_ID = '60ee899e9305de0df5b0fcade5'
const PAYMENT_INSTRUMENT_ID = '060e03df91c98e72c21086e0e2'
const PRODUCT_ID = '25518823M'
const RANDOM_STR = Math.random().toString(36).slice(2, 7)

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
            <h3>Returned data</h3>
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
    const loginRegisteredUser = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)

    // TODO: Implement the flow - Login as a guest user and then registered that user.
    //  Currently Login as a guest doesn't work in packages/test-commerce-sdk-react/app/pages/use-auth-helper.tsx
    // const loginGuestUser = useAuthHelper(AuthHelpers.LoginGuestUser)
    // const guestUserMutationHooks = [
    //     {
    //         action: 'registerCustomer',
    //         body: {
    //             customer: {
    //                 login: `jsmith${RANDOM_STR}@test.com`,
    //                 email: `jsmith${RANDOM_STR}@test.com`,
    //                 first_name: `John${RANDOM_STR}`,
    //                 last_name: `Smith${RANDOM_STR}`
    //             },
    //             password: 'Abcd!12345'
    //         },
    //         parameters: {}
    //     }
    // ]

    const mutationHooks = [
        {
            action: 'updateCustomer',
            body: {firstName: `Kobe${RANDOM_STR}`},
            parameters: {customerId: CUSTOMER_ID}
        },
        // {
        //     action: 'updateCustomerPassword',
        //     body: {currentPassword: 'Test12345!', password: 'Test1234!'},
        //     parameters: {customerId: CUSTOMER_ID}
        // },
        // TODO: Not working in PWA Kit Today. Potentially related to the issue scoping tokens
        //  https://pwa-kit.mobify-storefront.com/global/en-GB/reset-password
        //  {"type":"https://api.commercecloud.salesforce.com/documentation/error/v1/errors/unauthorized","title":"Unauthorized","detail":"Your access-token is invalid and could not be used to identify the API client."}
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
            action: 'updateCustomerProductList',
            body: {description: `List was editied on ${new Date().toLocaleString()}`},
            parameters: {customerId: CUSTOMER_ID, listId: LIST_ID}
        },
        {
            action: 'deleteCustomerProductList',
            body: {},
            parameters: {customerId: CUSTOMER_ID, listId: LIST_ID}
        },
        {
            action: 'createCustomerProductListItem',
            body: {priority: 2, public: true, quantity: 3, type: 'product', productId: PRODUCT_ID},
            parameters: {customerId: CUSTOMER_ID, listId: LIST_ID}
        },
        {
            action: 'updateCustomerProductListItem',
            body: {priority: 2, public: true, quantity: 13},
            parameters: {customerId: CUSTOMER_ID, listId: LIST_ID, itemId: ITEM_ID}
        },
        {
            action: 'deleteCustomerProductListItem',
            body: {},
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
            parameters: {customerId: CUSTOMER_ID, paymentInstrumentId: PAYMENT_INSTRUMENT_ID}
        }
    ].map(({action, body, parameters}) => {
        return {
            name: action,
            // This is essentially a shorthand to avoid writing out a giant object;
            // it *technically* violates the rules of hooks, but not in an impactful way.
            // eslint-disable-next-line react-hooks/rules-of-hooks
            hook: useShopperCustomersMutation(action as ShopperCustomersMutation),
            body,
            parameters
        }
    })

    const queryHooks = [
        {
            name: 'useCustomer',
            hook: useCustomer({
                parameters: {customerId: CUSTOMER_ID}
            })
        },
        {
            name: 'useCustomerAddress',
            hook: useCustomerAddress({
                parameters: {
                    customerId: CUSTOMER_ID,
                    addressName: ADDRESS_NAME
                }
            })
        },
        {
            name: 'useCustomerOrders',
            hook: useCustomerOrders({
                parameters: {customerId: CUSTOMER_ID}
            })
        },
        {
            name: 'useCustomerBaskets',
            hook: useCustomerBaskets({
                parameters: {customerId: CUSTOMER_ID}
            })
        },
        {
            name: 'useCustomerProductLists',
            hook: useCustomerProductLists({
                parameters: {customerId: CUSTOMER_ID}
            })
        },
        {
            name: 'useCustomerProductList',
            hook: useCustomerProductList({
                parameters: {customerId: CUSTOMER_ID, listId: LIST_ID}
            })
        }
    ]

    const loginError = loginRegisteredUser.error
    const loginErrorMessage = loginError instanceof Error ? loginError.message : loginError

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
                    {loginError && (
                        <p style={{color: 'red'}}>
                            <>Error: {loginErrorMessage}</>
                        </p>
                    )}
                </>
            ) : (
                <>
                    <div>
                        <h1>Query hooks</h1>
                        {queryHooks.map(({name, hook}) => {
                            return renderQueryHook(name, {...hook})
                        })}
                    </div>
                    <div>
                        <h1>Mutation hooks</h1>
                        {mutationHooks.map((mutation) => {
                            return renderMutationHook({...mutation})
                        })}
                    </div>
                </>
            )}
        </>
    )
}

UseCustomer.getTemplateName = () => 'UseCustomer'

export default UseCustomer
