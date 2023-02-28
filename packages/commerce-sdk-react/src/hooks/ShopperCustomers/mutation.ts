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

/** Mutations available for Shopper Customers. */
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
   * **DEPRECATION NOTICE**

To enhance the security and availability of Salesforce services, this endpoint is now _**deprecated**_, and _**we plan to remove it in mid-2022**_. This endpoint is not available to new customers, and we discourage existing customers from using it. Instead, we strongly recommend using the endpoints of the [Shopper Login and API Access Service](https://developer.commercecloud.com/s/api-details/a003k00000VWfNDAA1/commerce-cloud-developer-centershopperloginandapiaccessservice) (SLAS) because they meet our rigorous standards for security and availability.

---

Log the user out.
   * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `invalidateCustomerAuth` endpoint.
   * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=invalidateCustomerAuth| Salesforce Developer Center} for more information about the API endpoint.
   * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#invalidatecustomerauth | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
   * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
   */
    InvalidateCustomerAuth: 'invalidateCustomerAuth',
    /**
   * **DEPRECATION NOTICE**

To enhance the security and availability of Salesforce services, this endpoint is now _**deprecated**_, and _**we plan to remove it in mid-2022**_. This endpoint is not available to new customers, and we discourage existing customers from using it. Instead, we strongly recommend using the endpoints of the [Shopper Login and API Access Service](https://developer.commercecloud.com/s/api-details/a003k00000VWfNDAA1/commerce-cloud-developer-centershopperloginandapiaccessservice) (SLAS) because they meet our rigorous standards for security and availability.

---

Obtains a new JSON Web Token (JWT)for a guest or registered
customer. Tokens are returned as an HTTP Authorization:Bearer response
header entry. These kinds of request are supported, as specified by the
type:

Type guest - creates a guest (non-authenticated) customer
and returns a token for the customer.
Request Body for guest : \{\"type\": \"guest\"\}
Type credentials - authenticates credentials passed in the
HTTP Authorization:Basic request header, returning a token for a
successfully authenticated customer, otherwise it throws an
AuthenticationFailedException.
Request Body for guest : \{\"type\": \"credentials\"\}
Type refresh - examines the token passed in the HTTP
Authorization:Bearer request header and when valid returns a new token
with an updated expiry time.
Request Body for guest : \{\"type\": \"refresh\"\}

For a request of type credentials:

Updates profile attributes for the customer (for example,
\"last-visited\").
Handles the maximum number of failed login attempts.

About JWT The token contains 3 sections:

The header section (specifies token type and algorithm used),
the payload section (contains customer information, client ID,
issue, and expiration time),
finally the signature section records the token signature.

A token is created and returned to the client whenever a registered
customer logs in (type \"credentials\") or a guest customer requests it (type
\"guest\"). The token is returned in the response header as 
Authorization: Bearer --token--

The client has to include the token in the request header as 
Authorization: Bearer --token-- 
in any follow-up request. The server declines any follow-up requests
without a token or which cannot be verified based on the token signature
or expiration time. A token nearing its expiration time should be
exchanged for a new one (type \"refresh\").

See \"API Usage \> JWT\" for more details on using JWT as an authentication
mechanism.
   * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `authorizeCustomer` endpoint.
   * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=authorizeCustomer| Salesforce Developer Center} for more information about the API endpoint.
   * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#authorizecustomer | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
   * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
   */
    AuthorizeCustomer: 'authorizeCustomer',
    /**
   * **DEPRECATION NOTICE**

To enhance the security and availability of Salesforce services, this endpoint is now _**deprecated**_, and _**we plan to remove it in mid-2022**_. This endpoint is not available to new customers, and we discourage existing customers from using it. Instead, we strongly recommend using the endpoints of the [Shopper Login and API Access Service](https://developer.commercecloud.com/s/api-details/a003k00000VWfNDAA1/commerce-cloud-developer-centershopperloginandapiaccessservice) (SLAS) because they meet our rigorous standards for security and availability.

---

Obtain the JSON Web Token (JWT) for registered customers whose credentials are stored using a third party system. Accepts loginId and 
clientId, returns a customer object in the response body and the JWT generated against the clientId in the response header.
   * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `authorizeTrustedSystem` endpoint.
   * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=authorizeTrustedSystem| Salesforce Developer Center} for more information about the API endpoint.
   * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#authorizetrustedsystem | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
   * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
   */
    AuthorizeTrustedSystem: 'authorizeTrustedSystem',
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
    /**
     * Registers a new external profile for a customer. This endpoint is in closed beta, available to select few customers. Please get in touch with your Account Team if you'd like to participate in the beta program
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `registerExternalProfile` endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=registerExternalProfile| Salesforce Developer Center} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#registerexternalprofile | `commerce-sdk-isomorphic` documentation} for more information on the parameters and returned data type.
     * @see {@link https://tanstack.com/query/latest/docs/react/reference/useMutation | TanStack Query `useMutation` reference} for more information about the return value.
     */
    RegisterExternalProfile: 'registerExternalProfile',
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

/** Mutation for Shopper Customers. */
export type ShopperCustomersMutation =
    (typeof ShopperCustomersMutations)[keyof typeof ShopperCustomersMutations]

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
