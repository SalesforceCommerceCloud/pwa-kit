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
