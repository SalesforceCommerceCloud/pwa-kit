/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients} from '../types'
import {createUseMutation, MethodsOf} from '../createUseMutation'
import {cacheUpdateMatrix} from './cache'

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
     */
    RegisterCustomer: 'registerCustomer',
    /**
     * Reset customer password, after obtaining a reset token. This is the second step in the reset customer password flow, where a customer password is reset by providing the new credentials along with a reset token. This call should be preceded by a call to the /create-reset-token endpoint.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `resetPassword` endpoint.
     */
    ResetPassword: 'resetPassword',
    /**
     * Get reset password token. This is the first step in the reset customer password flow, where a password reset token is requested for future use to reset a customer password. This call should be followed by a call to the /reset endpoint.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `getResetPasswordToken` endpoint.
     */
    GetResetPasswordToken: 'getResetPasswordToken',
    // TODO: Re-implement (and update description from RAML spec) when the endpoint exits closed beta.
    // /**
    //  * Registers a new external profile for a customer. This endpoint is in closed beta, available to select few customers. Please get in touch with your Account Team if you'd like to participate in the beta program
    //  * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `registerExternalProfile` endpoint.
    //  */
    // RegisterExternalProfile: 'registerExternalProfile',
    /**
     * Updates a customer.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `updateCustomer` endpoint.
     */
    UpdateCustomer: 'updateCustomer',
    /**
     * Creates a new address with the given name for the given customer.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `createCustomerAddress` endpoint.
     */
    CreateCustomerAddress: 'createCustomerAddress',
    /**
     * Deletes a customer's address by address name.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `removeCustomerAddress` endpoint.
     */
    RemoveCustomerAddress: 'removeCustomerAddress',
    /**
     * Updates a customer's address by address name.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `updateCustomerAddress` endpoint.
     */
    UpdateCustomerAddress: 'updateCustomerAddress',
    /**
     * Updates the customer's password.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `updateCustomerPassword` endpoint.
     */
    UpdateCustomerPassword: 'updateCustomerPassword',
    /**
     * Adds a payment instrument to the customer information.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `createCustomerPaymentInstrument` endpoint.
     */
    CreateCustomerPaymentInstrument: 'createCustomerPaymentInstrument',
    /**
     * Deletes a customer's payment instrument.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `deleteCustomerPaymentInstrument` endpoint.
     */
    DeleteCustomerPaymentInstrument: 'deleteCustomerPaymentInstrument',
    /**
     * Creates a customer product list.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `createCustomerProductList` endpoint.
     */
    CreateCustomerProductList: 'createCustomerProductList',
    /**
     * Deletes a customer product list.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `deleteCustomerProductList` endpoint.
     */
    DeleteCustomerProductList: 'deleteCustomerProductList',
    /**
     * Changes a product list. Changeable properties are the name, description, and if the list is public.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `updateCustomerProductList` endpoint.
     */
    UpdateCustomerProductList: 'updateCustomerProductList',
    /**
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `createCustomerProductListItem` endpoint.
     */
    CreateCustomerProductListItem: 'createCustomerProductListItem',
    /**
     * Removes an item from a customer product list.
     * @returns A TanStack Query mutation hook for interacting with the Shopper Customers `deleteCustomerProductListItem` endpoint.
     */
    DeleteCustomerProductListItem: 'deleteCustomerProductListItem',
    /**
     * Updates an item of a customer's product list.
     */
    UpdateCustomerProductListItem: 'updateCustomerProductListItem'
} as const

/**
 * Mutation for Shopper Customers.
 * @group ShopperCustomers
 * @category Mutation
 */
export type ShopperCustomersMutation = MethodsOf<ApiClients['shopperCustomers']>

/**
 * Mutation hook for Shopper Customers.
 * @group ShopperCustomers
 * @category Mutation
 */
export const useShopperCustomersMutation = createUseMutation<
    'shopperCustomers',
    ShopperCustomersMutation
>({
    clientKey: 'shopperCustomers',
    getCacheUpdates: (mutation) => cacheUpdateMatrix[mutation]
})
