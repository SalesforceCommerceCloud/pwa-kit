/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ActionResponse, ApiClients, Argument, DataType} from '../types'
import {useAsyncCallback} from '../useAsync'
import useCommerceApi from '../useCommerceApi'

type Client = ApiClients['shopperCustomers']

export enum ShopperCustomersActions {
    /**
     * Registers a new customer. The mandatory data are the credentials, profile last name, and email. This requires a JSON Web Token (JWT) which needs to be obtained using the POST /customers/auth API with type \"guest\".
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=registerCustomer} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#registercustomer} for more information on the parameters and returned data type.
     */
    RegisterCustomer = 'registerCustomer',
    /**
   * **DEPRECATION NOTICE**

To enhance the security and availability of Salesforce services, this endpoint is now _**deprecated**_, and _**we plan to remove it in mid-2022**_. This endpoint is not available to new customers, and we discourage existing customers from using it. Instead, we strongly recommend using the endpoints of the [Shopper Login and API Access Service](https://developer.commercecloud.com/s/api-details/a003k00000VWfNDAA1/commerce-cloud-developer-centershopperloginandapiaccessservice) (SLAS) because they meet our rigorous standards for security and availability.

---

Log the user out.
   * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=invalidateCustomerAuth} for more information about the API endpoint.
   * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#invalidatecustomerauth} for more information on the parameters and returned data type.
   */
    InvalidateCustomerAuth = 'invalidateCustomerAuth',
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
   * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=authorizeCustomer} for more information about the API endpoint.
   * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#authorizecustomer} for more information on the parameters and returned data type.
   */
    AuthorizeCustomer = 'authorizeCustomer',
    /**
   * **DEPRECATION NOTICE**

To enhance the security and availability of Salesforce services, this endpoint is now _**deprecated**_, and _**we plan to remove it in mid-2022**_. This endpoint is not available to new customers, and we discourage existing customers from using it. Instead, we strongly recommend using the endpoints of the [Shopper Login and API Access Service](https://developer.commercecloud.com/s/api-details/a003k00000VWfNDAA1/commerce-cloud-developer-centershopperloginandapiaccessservice) (SLAS) because they meet our rigorous standards for security and availability.

---

Obtain the JSON Web Token (JWT) for registered customers whose credentials are stored using a third party system. Accepts loginId and 
clientId, returns a customer object in the response body and the JWT generated against the clientId in the response header.
   * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=authorizeTrustedSystem} for more information about the API endpoint.
   * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#authorizetrustedsystem} for more information on the parameters and returned data type.
   */
    AuthorizeTrustedSystem = 'authorizeTrustedSystem',
    /**
     * Reset customer password, after obtaining a reset token. This is the second step in the reset customer password flow, where a customer password is reset by providing the new credentials along with a reset token. This call should be preceded by a call to the /create-reset-token endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=resetPassword} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#resetpassword} for more information on the parameters and returned data type.
     */
    ResetPassword = 'resetPassword',
    /**
     * Get reset password token. This is the first step in the reset customer password flow, where a password reset token is requested for future use to reset a customer password. This call should be followed by a call to the /reset endpoint.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getResetPasswordToken} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getresetpasswordtoken} for more information on the parameters and returned data type.
     */
    GetResetPasswordToken = 'getResetPasswordToken',
    /**
     * Registers a new external profile for a customer. This endpoint is in closed beta, available to select few customers. Please get in touch with your Account Team if you'd like to participate in the beta program
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=registerExternalProfile} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#registerexternalprofile} for more information on the parameters and returned data type.
     */
    RegisterExternalProfile = 'registerExternalProfile',
    /**
     * Updates a customer.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=updateCustomer} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#updatecustomer} for more information on the parameters and returned data type.
     */
    UpdateCustomer = 'updateCustomer',
    /**
     * Creates a new address with the given name for the given customer.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=createCustomerAddress} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#createcustomeraddress} for more information on the parameters and returned data type.
     */
    CreateCustomerAddress = 'createCustomerAddress',
    /**
     * Deletes a customer's address by address name.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=removeCustomerAddress} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#removecustomeraddress} for more information on the parameters and returned data type.
     */
    RemoveCustomerAddress = 'removeCustomerAddress',
    /**
     * Updates a customer's address by address name.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=updateCustomerAddress} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#updatecustomeraddress} for more information on the parameters and returned data type.
     */
    UpdateCustomerAddress = 'updateCustomerAddress',
    /**
     * Updates the customer's password.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=updateCustomerPassword} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#updatecustomerpassword} for more information on the parameters and returned data type.
     */
    UpdateCustomerPassword = 'updateCustomerPassword',
    /**
     * Adds a payment instrument to the customer information.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=createCustomerPaymentInstrument} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#createcustomerpaymentinstrument} for more information on the parameters and returned data type.
     */
    CreateCustomerPaymentInstrument = 'createCustomerPaymentInstrument',
    /**
     * Deletes a customer's payment instrument.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=deleteCustomerPaymentInstrument} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#deletecustomerpaymentinstrument} for more information on the parameters and returned data type.
     */
    DeleteCustomerPaymentInstrument = 'deleteCustomerPaymentInstrument',
    /**
     * Creates a customer product list.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=createCustomerProductList} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#createcustomerproductlist} for more information on the parameters and returned data type.
     */
    CreateCustomerProductList = 'createCustomerProductList',
    /**
     * Deletes a customer product list.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=deleteCustomerProductList} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#deletecustomerproductlist} for more information on the parameters and returned data type.
     */
    DeleteCustomerProductList = 'deleteCustomerProductList',
    /**
     * Changes a product list. Changeable properties are the name, description, and if the list is public.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=updateCustomerProductList} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#updatecustomerproductlist} for more information on the parameters and returned data type.
     */
    UpdateCustomerProductList = 'updateCustomerProductList',
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
   * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=createCustomerProductListItem} for more information about the API endpoint.
   * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#createcustomerproductlistitem} for more information on the parameters and returned data type.
   */
    CreateCustomerProductListItem = 'createCustomerProductListItem',
    /**
     * Removes an item from a customer product list.
     * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=deleteCustomerProductListItem} for more information about the API endpoint.
     * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#deletecustomerproductlistitem} for more information on the parameters and returned data type.
     */
    DeleteCustomerProductListItem = 'deleteCustomerProductListItem',
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
   * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=updateCustomerProductListItem} for more information about the API endpoint.
   * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#updatecustomerproductlistitem} for more information on the parameters and returned data type.
   */
    UpdateCustomerProductListItem = 'updateCustomerProductListItem',
}

/**
 * A hook for performing actions with the Shopper Customers API.
 */
export function useShopperCustomersAction<Action extends ShopperCustomersActions>(
    action: Action
): ActionResponse<Parameters<Client[Action]>, DataType<Client[Action]>> {
    type Arg = Parameters<Client[Action]>
    type Data = DataType<Client[Action]>
    // Directly calling `client[action](arg)` doesn't work, because the methods don't fully
    // overlap. Adding in this type assertion fixes that, but I don't understand why. I'm fairly
    // confident, though, that it is safe, because it seems like we're mostly re-defining what we
    // already have.
    // In addition to the assertion required to get this to work, I have also simplified the
    // overloaded SDK method to a single signature that just returns the data type. This makes it
    // easier to work with when passing to other mapped types.
    function assertMethod(fn: unknown): asserts fn is (arg: Arg) => Promise<Data> {
        if (typeof fn !== 'function') throw new Error(`Unknown action: ${action}`)
    }
    const {shopperCustomers: client} = useCommerceApi()
    const method = client[action]
    assertMethod(method)

    return useAsyncCallback((...arg: Arg) => method.call(client, arg))
}
