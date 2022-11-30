/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Argument, DataType} from '../types'
import {useMutation} from '../useMutation'
import {MutationFunction, useQueryClient} from '@tanstack/react-query'
import {updateCache, QueryKeysMatrixElement, Client, NotImplemented} from '../utils'

export const ShopperCustomersMutations = {
    /**
     * Registers a new customer. The mandatory data are the credentials, profile last name, and email. This requires a JSON Web Token (JWT) which needs to be obtained using the POST /customers/auth API with type \"guest\".
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=registerCustomer} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#registercustomer} for more information on the parameters and returned data type.
     */
    RegisterCustomer: 'registerCustomer',
    /**
     * WARNING: This method is not implemented.
     *
     * **DEPRECATION NOTICE**
     * To enhance the security and availability of Salesforce services, this endpoint is now _**deprecated**_, and _**we plan to remove it in mid-2022**_. This endpoint is not available to new customers, and we discourage existing customers from using it. Instead, we strongly recommend using the endpoints of the [Shopper Login and API Access Service](https://developer.commercecloud.com/s/api-details/a003k00000VWfNDAA1/commerce-cloud-developer-centershopperloginandapiaccessservice) (SLAS) because they meet our rigorous standards for security and availability.
     * ---
     * Log the user out.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=invalidateCustomerAuth} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#invalidatecustomerauth} for more information on the parameters and returned data type.
     */
    InvalidateCustomerAuth: 'invalidateCustomerAuth',
    /**
     * WARNING: This method is not implemented.
     *
     * **DEPRECATION NOTICE**
     * To enhance the security and availability of Salesforce services, this endpoint is now _**deprecated**_, and _**we plan to remove it in mid-2022**_. This endpoint is not available to new customers, and we discourage existing customers from using it. Instead, we strongly recommend using the endpoints of the [Shopper Login and API Access Service](https://developer.commercecloud.com/s/api-details/a003k00000VWfNDAA1/commerce-cloud-developer-centershopperloginandapiaccessservice) (SLAS) because they meet our rigorous standards for security and availability.
     * ---
     * Obtains a new JSON Web Token (JWT)for a guest or registered customer.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=authorizeCustomer} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#authorizecustomer} for more information on the parameters and returned data type.
     */
    AuthorizeCustomer: 'authorizeCustomer',
    /**
     * WARNING: This method is not implemented.
     *
     * **DEPRECATION NOTICE**
     * To enhance the security and availability of Salesforce services, this endpoint is now _**deprecated**_, and _**we plan to remove it in mid-2022**_. This endpoint is not available to new customers, and we discourage existing customers from using it. Instead, we strongly recommend using the endpoints of the [Shopper Login and API Access Service](https://developer.commercecloud.com/s/api-details/a003k00000VWfNDAA1/commerce-cloud-developer-centershopperloginandapiaccessservice) (SLAS) because they meet our rigorous standards for security and availability.
     * ---
     * Obtain the JSON Web Token (JWT) for registered customers whose credentials are stored using a third party system.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=authorizeTrustedSystem} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#authorizetrustedsystem} for more information on the parameters and returned data type.
     */
    AuthorizeTrustedSystem: 'authorizeTrustedSystem',
    /**
     * WARNING: This method is not implemented.
     *
     * Reset customer password, after obtaining a reset token. This is the second step in the reset customer password flow, where a customer password is reset by providing the new credentials along with a reset token. This call should be preceded by a call to the /create-reset-token endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=resetPassword} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#resetpassword} for more information on the parameters and returned data type.
     */
    ResetPassword: 'resetPassword',
    /**
     * WARNING: This method is not implemented.
     *
     * Get reset password token. This is the first step in the reset customer password flow, where a password reset token is requested for future use to reset a customer password. This call should be followed by a call to the /reset endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getResetPasswordToken} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getresetpasswordtoken} for more information on the parameters and returned data type.
     */
    GetResetPasswordToken: 'getResetPasswordToken',
    /**
     * WARNING: This method is not implemented.
     *
     * Registers a new external profile for a customer. This endpoint is in closed beta, available to select few customers. Please get in touch with your Account Team if you'd like to participate in the beta program
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=registerExternalProfile} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#registerexternalprofile} for more information on the parameters and returned data type.
     */
    RegisterExternalProfile: 'registerExternalProfile',
    /**
     * Updates a customer.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=updateCustomer} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#updatecustomer} for more information on the parameters and returned data type.
     */
    UpdateCustomer: 'updateCustomer',
    /**
     * Creates a new address with the given name for the given customer.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=createCustomerAddress} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#createcustomeraddress} for more information on the parameters and returned data type.
     */
    CreateCustomerAddress: 'createCustomerAddress',
    /**
     * Deletes a customer's address by address name.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=removeCustomerAddress} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#removecustomeraddress} for more information on the parameters and returned data type.
     */
    RemoveCustomerAddress: 'removeCustomerAddress',
    /**
     * Updates a customer's address by address name.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=updateCustomerAddress} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#updatecustomeraddress} for more information on the parameters and returned data type.
     */
    UpdateCustomerAddress: 'updateCustomerAddress',
    /**
     * WARNING: This method is not implemented.
     *
     * Updates the customer's password.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=updateCustomerPassword} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#updatecustomerpassword} for more information on the parameters and returned data type.
     */
    UpdateCustomerPassword: 'updateCustomerPassword',
    /**
     * Adds a payment instrument to the customer information.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=createCustomerPaymentInstrument} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#createcustomerpaymentinstrument} for more information on the parameters and returned data type.
     */
    CreateCustomerPaymentInstrument: 'createCustomerPaymentInstrument',
    /**
     * Deletes a customer's payment instrument.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=deleteCustomerPaymentInstrument} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#deletecustomerpaymentinstrument} for more information on the parameters and returned data type.
     */
    DeleteCustomerPaymentInstrument: 'deleteCustomerPaymentInstrument',
    /**
     * Creates a customer product list.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=createCustomerProductList} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#createcustomerproductlist} for more information on the parameters and returned data type.
     */
    CreateCustomerProductList: 'createCustomerProductList',
    /**
     * WARNING: This method is not implemented.
     *
     * Deletes a customer product list.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=deleteCustomerProductList} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#deletecustomerproductlist} for more information on the parameters and returned data type.
     */
    DeleteCustomerProductList: 'deleteCustomerProductList',
    /**
     * WARNING: This method is not implemented.
     *
     * Changes a product list. Changeable properties are the name, description, and if the list is public.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=updateCustomerProductList} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#updatecustomerproductlist} for more information on the parameters and returned data type.
     */
    UpdateCustomerProductList: 'updateCustomerProductList',
    /**
     * Adds an item to the customer's product list. Considered values from the request body are:
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=createCustomerProductListItem} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#createcustomerproductlistitem} for more information on the parameters and returned data type.
     */
    CreateCustomerProductListItem: 'createCustomerProductListItem',
    /**
     * Removes an item from a customer product list.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=deleteCustomerProductListItem} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#deletecustomerproductlistitem} for more information on the parameters and returned data type.
     */
    DeleteCustomerProductListItem: 'deleteCustomerProductListItem',
    /**
     * Updates an item of a customer's product list.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=updateCustomerProductListItem} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#updatecustomerproductlistitem} for more information on the parameters and returned data type.
     */
    UpdateCustomerProductListItem: 'updateCustomerProductListItem'
} as const

export type ShopperCustomersMutationType = typeof ShopperCustomersMutations[keyof typeof ShopperCustomersMutations]

export const shopperCustomersQueryKeysMatrix = {
    authorizeCustomer: (
        params: Argument<Client['authorizeCustomer']>,
        response: DataType<Client['authorizeCustomer']>
    ): QueryKeysMatrixElement => {
        return {}
    },
    authorizeTrustedSystem: (
        params: Argument<Client['authorizeTrustedSystem']>,
        response: DataType<Client['authorizeTrustedSystem']>
    ): QueryKeysMatrixElement => {
        return {}
    },
    deleteCustomerProductList: (
        params: Argument<Client['deleteCustomerProductList']>,
        response: DataType<Client['deleteCustomerProductList']>
    ): QueryKeysMatrixElement => {
        return {}
    },
    getResetPasswordToken: (
        params: Argument<Client['getResetPasswordToken']>,
        response: DataType<Client['getResetPasswordToken']>
    ): QueryKeysMatrixElement => {
        return {}
    },
    invalidateCustomerAuth: (
        params: Argument<Client['invalidateCustomerAuth']>,
        response: DataType<Client['invalidateCustomerAuth']>
    ): QueryKeysMatrixElement => {
        return {}
    },
    registerCustomer: (
        params: Argument<Client['registerCustomer']>,
        response: DataType<Client['registerCustomer']>
    ): QueryKeysMatrixElement => {
        return {}
    },
    registerExternalProfile: (
        params: Argument<Client['registerExternalProfile']>,
        response: DataType<Client['registerExternalProfile']>
    ): QueryKeysMatrixElement => {
        return {}
    },
    resetPassword: (
        params: Argument<Client['resetPassword']>,
        response: DataType<Client['resetPassword']>
    ): QueryKeysMatrixElement => {
        return {}
    },
    updateCustomerPassword: (
        params: Argument<Client['updateCustomerPassword']>,
        response: DataType<Client['updateCustomerPassword']>
    ): QueryKeysMatrixElement => {
        return {}
    },
    updateCustomerProductList: (
        params: Argument<Client['updateCustomerProductList']>,
        response: DataType<Client['updateCustomerProductList']>
    ): QueryKeysMatrixElement => {
        return {}
    },
    updateCustomer: (
        params: Argument<Client['updateCustomer']>,
        response: DataType<Client['updateCustomer']>
    ): QueryKeysMatrixElement => {
        const {customerId} = params.parameters
        return {
            update: [['/customers', customerId, {customerId}]],
            invalidate: [
                ['/customers', customerId, '/payment-instruments'],
                ['/customers', customerId, '/addresses'],
                ['/customers', '/external-profile']
            ]
        }
    },

    updateCustomerAddress: (
        params: Argument<Client['updateCustomerAddress']>,
        response: DataType<Client['updateCustomerAddress']>
    ): QueryKeysMatrixElement => {
        const {customerId, addressName} = params.parameters
        return {
            update: [['/customers', customerId, '/addresses', {addressName, customerId}]],
            invalidate: [['/customers', customerId, {customerId}]]
        }
    },

    createCustomerAddress: (
        params: Argument<Client['createCustomerAddress']>,
        response: DataType<Client['createCustomerAddress']>
    ): QueryKeysMatrixElement => {
        const {customerId} = params.parameters
        const {addressId} = params.body
        return {
            update: [
                ['/customers', customerId, '/addresses', {addressName: addressId, customerId}]
            ],
            invalidate: [['/customers', customerId, {customerId}]]
        }
    },

    removeCustomerAddress: (
        params: Argument<Client['removeCustomerAddress']>,
        response: DataType<Client['removeCustomerAddress']>
    ): QueryKeysMatrixElement => {
        // TODO: Fix the RequireParametersUnlessAllAreOptional commerce-sdk-isomorphic type assertion
        //  The required parameters become optional accidentally
        // @ts-ignore
        const {customerId, addressName} = params.parameters
        return {
            invalidate: [['/customers', customerId, {customerId}]],
            remove: [['/customers', customerId, '/addresses', {addressName, customerId}]]
        }
    },

    createCustomerPaymentInstrument: (
        params: Argument<Client['createCustomerPaymentInstrument']>,
        response: DataType<Client['createCustomerPaymentInstrument']>
    ): QueryKeysMatrixElement => {
        const {customerId} = params.parameters
        return {
            update: [
                [
                    '/customers',
                    customerId,
                    '/payment-instruments',
                    {
                        customerId,
                        paymentInstrumentId: response?.paymentInstrumentId
                    }
                ]
            ],
            invalidate: [['/customers', customerId, {customerId}]]
        }
    },

    deleteCustomerPaymentInstrument: (
        params: Argument<Client['deleteCustomerPaymentInstrument']>,
        response: DataType<Client['deleteCustomerPaymentInstrument']>
    ): QueryKeysMatrixElement => {
        // TODO: Fix the RequireParametersUnlessAllAreOptional commerce-sdk-isomorphic type assertion
        //  The required parameters become optional accidentally
        // @ts-ignore
        const {customerId, paymentInstrumentId} = params.parameters
        return {
            invalidate: [['/customers', customerId, {customerId}]],
            remove: [
                [
                    '/customers',
                    customerId,
                    '/payment-instruments',
                    {customerId, paymentInstrumentId}
                ]
            ]
        }
    },

    createCustomerProductList: (
        params: Argument<Client['createCustomerProductList']>,
        response: DataType<Client['createCustomerProductList']>
    ): QueryKeysMatrixElement => {
        const {customerId} = params.parameters
        return {
            update: [
                ['/customers', customerId, '/product-list', {customerId, listId: response?.id}]
            ]
        }
    },

    createCustomerProductListItem: (
        params: Argument<Client['createCustomerProductListItem']>,
        response: DataType<Client['createCustomerProductListItem']>
    ): QueryKeysMatrixElement => {
        const {customerId, listId} = params.parameters
        return {
            update: [['/customers', customerId, '/product-list', listId, {itemId: response?.id}]],
            invalidate: [['/customers', customerId, '/product-list', {customerId, listId}]]
        }
    },

    updateCustomerProductListItem: (
        params: Argument<Client['updateCustomerProductListItem']>,
        response: DataType<Client['updateCustomerProductListItem']>
    ): QueryKeysMatrixElement => {
        const {customerId, listId, itemId} = params.parameters
        return {
            update: [['/customers', customerId, '/product-list', listId, {itemId}]],
            invalidate: [['/customers', customerId, '/product-list', {customerId, listId}]]
        }
    },

    deleteCustomerProductListItem: (
        params: Argument<Client['deleteCustomerProductListItem']>,
        response: DataType<Client['deleteCustomerProductListItem']>
    ): QueryKeysMatrixElement => {
        // TODO: Fix the RequireParametersUnlessAllAreOptional commerce-sdk-isomorphic type assertion
        //  The required parameters become optional accidentally
        // @ts-ignore
        const {customerId, listId, itemId} = params.parameters
        return {
            invalidate: [['/customers', customerId, '/product-list', {customerId, listId}]],
            remove: [['/customers', customerId, '/product-list', listId, {itemId}]]
        }
    }
}

export const SHOPPER_CUSTOMERS_NOT_IMPLEMENTED = [
    'authorizeCustomer',
    'authorizeTrustedSystem',
    'deleteCustomerProductList',
    'getResetPasswordToken',
    'invalidateCustomerAuth',
    'registerExternalProfile',
    'resetPassword',
    'updateCustomerPassword',
    'updateCustomerProductList'
]

/**
 * A hook for performing mutations with the Shopper Customers API.
 */
export function useShopperCustomersMutation<Action extends ShopperCustomersMutationType>(
    action: Action
) {
    if (SHOPPER_CUSTOMERS_NOT_IMPLEMENTED.includes(action)) {
        NotImplemented()
    }
    type Params = Argument<Client[Action]>
    type Data = DataType<Client[Action]>
    const queryClient = useQueryClient()
    return useMutation<Data, Error, Params>(
        (params, apiClients) => {
            const method = apiClients['shopperCustomers'][action] as MutationFunction<Data, Params>
            return method.call(apiClients['shopperCustomers'], params)
        },
        {
            onSuccess: (data, params) => {
                updateCache(queryClient, action, shopperCustomersQueryKeysMatrix, data, params)
            }
        }
    )
}
