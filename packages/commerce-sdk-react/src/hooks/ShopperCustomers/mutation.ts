/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, ApiMethod, Argument, CacheUpdateGetter, DataType, MergedOptions} from '../types'
import {useMutation} from '../useMutation'
import {UseMutationResult} from '@tanstack/react-query'
import {NotImplementedError} from '../utils'
import useCommerceApi from '../useCommerceApi'
import {cacheUpdateMatrix} from './cache'

type Client = ApiClients['shopperCustomers']

/**
 * Mutations available for Shopper Customers.
 * @group ShopperCustomers
 * @category Mutation
 * @enum
*/
export const ShopperCustomersMutations = {
    /**
     * Registers a new customer. The mandatory data are the credentials, profile last name, and email. This requires a JSON Web Token (JWT) which needs to be obtained using the POST /customers/auth API with type \"guest\".
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `registerCustomer` endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=registerCustomer| Salesforce Developer Center} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#registercustomer | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
     * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
     */
    RegisterCustomer: 'registerCustomer',
    /**
     * Reset customer password, after obtaining a reset token. This is the second step in the reset customer password flow, where a customer password is reset by providing the new credentials along with a reset token. This call should be preceded by a call to the /create-reset-token endpoint.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `resetPassword` endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=resetPassword| Salesforce Developer Center} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#resetpassword | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
     * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
     */
    ResetPassword: 'resetPassword',
    /**
     * Get reset password token. This is the first step in the reset customer password flow, where a password reset token is requested for future use to reset a customer password. This call should be followed by a call to the /reset endpoint.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `getResetPasswordToken` endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getResetPasswordToken| Salesforce Developer Center} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getresetpasswordtoken | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
     * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
     */
    GetResetPasswordToken: 'getResetPasswordToken',
    // TODO: Re-implement (and update description from RAML spec) when the endpoint exits closed beta.
    // /**
    //  * Registers a new external profile for a customer. This endpoint is in closed beta, available to select few customers. Please get in touch with your Account Team if you'd like to participate in the beta program
    //  * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `registerExternalProfile` endpoint.
    //  * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=registerExternalProfile| Salesforce Developer Center} for more information about the API endpoint.
    //  * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#registerexternalprofile | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
    //  * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
    //  */
    // RegisterExternalProfile: 'registerExternalProfile',
    /**
     * Updates a customer.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `updateCustomer` endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=updateCustomer| Salesforce Developer Center} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#updatecustomer | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
     * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
     */
    UpdateCustomer: 'updateCustomer',
    /**
     * Creates a new address with the given name for the given customer.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `createCustomerAddress` endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=createCustomerAddress| Salesforce Developer Center} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#createcustomeraddress | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
     * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
     */
    CreateCustomerAddress: 'createCustomerAddress',
    /**
     * Deletes a customer's address by address name.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `removeCustomerAddress` endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=removeCustomerAddress| Salesforce Developer Center} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#removecustomeraddress | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
     * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
     */
    RemoveCustomerAddress: 'removeCustomerAddress',
    /**
     * Updates a customer's address by address name.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `updateCustomerAddress` endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=updateCustomerAddress| Salesforce Developer Center} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#updatecustomeraddress | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
     * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
     */
    UpdateCustomerAddress: 'updateCustomerAddress',
    /**
     * Updates the customer's password.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `updateCustomerPassword` endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=updateCustomerPassword| Salesforce Developer Center} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#updatecustomerpassword | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
     * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
     */
    UpdateCustomerPassword: 'updateCustomerPassword',
    /**
     * Adds a payment instrument to the customer information.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `createCustomerPaymentInstrument` endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=createCustomerPaymentInstrument| Salesforce Developer Center} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#createcustomerpaymentinstrument | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
     * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
     */
    CreateCustomerPaymentInstrument: 'createCustomerPaymentInstrument',
    /**
     * Deletes a customer's payment instrument.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `deleteCustomerPaymentInstrument` endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=deleteCustomerPaymentInstrument| Salesforce Developer Center} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#deletecustomerpaymentinstrument | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
     * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
     */
    DeleteCustomerPaymentInstrument: 'deleteCustomerPaymentInstrument',
    /**
     * Creates a customer product list.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `createCustomerProductList` endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=createCustomerProductList| Salesforce Developer Center} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#createcustomerproductlist | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
     * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
     */
    CreateCustomerProductList: 'createCustomerProductList',
    /**
     * Deletes a customer product list.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `deleteCustomerProductList` endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=deleteCustomerProductList| Salesforce Developer Center} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#deletecustomerproductlist | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
     * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
     */
    DeleteCustomerProductList: 'deleteCustomerProductList',
    /**
     * Changes a product list. Changeable properties are the name, description, and if the list is public.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `updateCustomerProductList` endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=updateCustomerProductList| Salesforce Developer Center} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#updatecustomerproductlist | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
     * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
     */
    UpdateCustomerProductList: 'updateCustomerProductList',
    /**
   * Adds an item to the customer's product list. Considered values from the request body are:

type: A valid type, mandatory. This is the type of the item to be added to the customer's product.
list.
priority: This is the priority of the item to be added to the customer's product list.
public: This is the flag whether the item to be added to the customer's product list is public.
product_id: A valid product ID, used for product item type only. This is the ID (SKU)
of the product related to the item to be added to the customer's product list. It is mandatory for
product item type, and it must be a valid product id, otherwise
ProductListProductIdMissingException or ProductListProductNotFoundException
will be thrown.
quantity: Used for product item type only. This is the quantity of the item to be
added to the customer's product list.
custom properties in the form c_\<CUSTOM_NAME\>: The custom property must correspond to a custom
attribute (\<CUSTOM_NAME\>) defined for ProductListItem. The value of this property must be valid for the
type of custom attribute defined for ProductListItem.
   * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `createCustomerProductListItem` endpoint.
   * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=createCustomerProductListItem| Salesforce Developer Center} for more information about the API endpoint.
   * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#createcustomerproductlistitem | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
   * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
   */
    CreateCustomerProductListItem: 'createCustomerProductListItem',
    /**
     * Removes an item from a customer product list.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `deleteCustomerProductListItem` endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=deleteCustomerProductListItem| Salesforce Developer Center} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#deletecustomerproductlistitem | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
     * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
     */
    DeleteCustomerProductListItem: 'deleteCustomerProductListItem',
    /**
   * Updates an item of a customer's product list.
Considered values from the request body are:

priority: This is the priority of the customer's product list item.
public: This is the flag whether the customer's product list item is public.
quantity: This is the quantity of
the customer's product list item. Used for product item type only. 
custom properties in the form c_\<CUSTOM_NAME\>: The custom property
must correspond to a custom attribute (\<CUSTOM_NAME\>) defined for ProductListItem.
The value of this property must be valid for the type of custom attribute defined for ProductListItem.
   * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `updateCustomerProductListItem` endpoint.
   * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=updateCustomerProductListItem| Salesforce Developer Center} for more information about the API endpoint.
   * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#updatecustomerproductlistitem | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
   * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
   */
    UpdateCustomerProductListItem: 'updateCustomerProductListItem'
} as const

/**
 * Mutation for Shopper Customers. 
 * @group ShopperCustomers
 * @category Mutation
 */
export type ShopperCustomersMutation =
    (typeof ShopperCustomersMutations)[keyof typeof ShopperCustomersMutations]

/**
 * Mutation hook for Shopper Customers.
 * @group ShopperCustomers
 * @category Mutation
 */
export function useShopperCustomersMutation<Mutation extends ShopperCustomersMutation>(
    mutation: Mutation
): UseMutationResult<DataType<Client[Mutation]>, unknown, Argument<Client[Mutation]>> {
    const getCacheUpdates = cacheUpdateMatrix[mutation]
    // TODO: Remove this check when all mutations are implemented.
    if (!getCacheUpdates) throw new NotImplementedError(`The '${mutation}' mutation`)

    // The `Options` and `Data` types for each mutation are similar, but distinct, and the union
    // type generated from `Client[Mutation]` seems to be too complex for TypeScript to handle.
    // I'm not sure if there's a way to avoid the type assertions in here for the methods that
    // use them. However, I'm fairly confident that they are safe to do, as they seem to be simply
    // re-asserting what we already have.
    const {shopperCustomers: client} = useCommerceApi()
    type Options = Argument<Client[Mutation]>
    type Data = DataType<Client[Mutation]>
    return useMutation({
        client,
        method: (opts: Options) => (client[mutation] as ApiMethod<Options, Data>)(opts),
        getCacheUpdates: getCacheUpdates as CacheUpdateGetter<MergedOptions<Client, Options>, Data>
    })
}
