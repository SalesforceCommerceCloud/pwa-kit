/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {UseQueryOptions, UseQueryResult} from '@tanstack/react-query'
import {ApiClients, Argument, DataType} from '../types'
import {useQuery} from '../useQuery'
import {NotImplementedError} from './../utils'

// TODO: Remove once phase2 is completed and all hooks are implemented
import useCommerceApi from '../useCommerceApi'

type Client = ApiClients['shopperCustomers']

/**
 * WARNING: This method is not implemented yet.
 *
 * A hook for `ShopperCustomers#getExternalProfile`.
 * Gets the new external profile for a customer.This endpoint is in closed beta, available to select few customers. Please get in touch with your Account Team if you'd like to participate in the beta program
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getExternalProfile} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getexternalprofile} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useExternalProfile(): void {
    NotImplementedError()
}

type UseCustomerParameters = NonNullable<Argument<Client['getCustomer']>>['parameters']
type UseCustomerHeaders = NonNullable<Argument<Client['getCustomer']>>['headers']
type UseCustomerArg = {headers?: UseCustomerHeaders; rawResponse?: boolean} & UseCustomerParameters
/**
 * A hook for `ShopperCustomers#getCustomer`.
 * Gets a customer with all existing addresses and payment instruments associated with the requested customer.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomer} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomer} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useCustomer(
    arg: Omit<UseCustomerArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getCustomer']> | Response, Error>
): UseQueryResult<DataType<Client['getCustomer']>, Error>
function useCustomer(
    arg: Omit<UseCustomerArg, 'rawResponse'> & {rawResponse?: true},
    options?: UseQueryOptions<DataType<Client['getCustomer']> | Response, Error>
): UseQueryResult<DataType<Client['getCustomer']>, Error>
function useCustomer(
    arg: UseCustomerArg,
    options?: UseQueryOptions<DataType<Client['getCustomer']> | Response, Error>
): UseQueryResult<DataType<Client['getCustomer']>, Error> {
    const {headers, rawResponse, ...parameters} = arg
    return useQuery(
        ['/customers', parameters.customerId, arg],
        (_, {shopperCustomers}) => {
            return shopperCustomers.getCustomer({parameters, headers}, rawResponse)
        },
        options
    )
}

type UseCustomerAddressParameters = NonNullable<
    Argument<Client['getCustomerAddress']>
>['parameters']
type UseCustomerAddressHeaders = NonNullable<Argument<Client['getCustomerAddress']>>['headers']
type UseCustomerAddressArg = {
    headers?: UseCustomerAddressHeaders
    rawResponse?: boolean
} & UseCustomerAddressParameters
/**
 * A hook for `ShopperCustomers#getCustomerAddress`.
 * Retrieves a customer's address by address name.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerAddress} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomeraddress} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useCustomerAddress(
    arg: Omit<UseCustomerAddressArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getCustomerAddress']> | Response, Error>
): UseQueryResult<DataType<Client['getCustomerAddress']>, Error>
function useCustomerAddress(
    arg: Omit<UseCustomerAddressArg, 'rawResponse'> & {rawResponse?: true},
    options?: UseQueryOptions<DataType<Client['getCustomerAddress']> | Response, Error>
): UseQueryResult<DataType<Client['getCustomerAddress']>, Error>
function useCustomerAddress(
    arg: UseCustomerAddressArg,
    options?: UseQueryOptions<DataType<Client['getCustomerAddress']> | Response, Error>
) {
    const {headers, rawResponse, ...parameters} = arg
    return useQuery(
        // TODO: `parameters.addressName` is also needed here
        ['/customers', parameters.customerId, '/addresses', arg],
        (_, {shopperCustomers}) => {
            return shopperCustomers.getCustomerAddress({parameters, headers}, rawResponse)
        },
        options
    )
}

type UseCustomerBasketsParameters = NonNullable<
    Argument<Client['getCustomerBaskets']>
>['parameters']
type UseCustomerBasketsHeaders = NonNullable<Argument<Client['getCustomerBaskets']>>['headers']
type UseCustomerBasketsArg = {
    headers?: UseCustomerBasketsHeaders
    rawResponse?: boolean
} & UseCustomerBasketsParameters
/**
 * A hook for `ShopperCustomers#getCustomerBaskets`.
 * Gets the baskets of a customer.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerBaskets} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerbaskets} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useCustomerBaskets(
    arg: Omit<UseCustomerBasketsArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getCustomerBaskets']> | Response, Error>
): UseQueryResult<DataType<Client['getCustomerBaskets']>, Error>
function useCustomerBaskets(
    arg: Omit<UseCustomerBasketsArg, 'rawResponse'> & {rawResponse?: true},
    options?: UseQueryOptions<DataType<Client['getCustomerBaskets']> | Response, Error>
): UseQueryResult<DataType<Client['getCustomerBaskets']>, Error>
function useCustomerBaskets(
    arg: UseCustomerBasketsArg,
    options?: UseQueryOptions<DataType<Client['getCustomerBaskets']> | Response, Error>
) {
    const {headers, rawResponse, ...parameters} = arg
    return useQuery(
        ['/customers', parameters.customerId, '/baskets', arg],
        (_, {shopperCustomers}) => {
            return shopperCustomers.getCustomerBaskets({parameters, headers}, rawResponse)
        },
        options
    )
}

type UseCustomerOrdersParameters = NonNullable<Argument<Client['getCustomerOrders']>>['parameters']
type UseCustomerOrdersHeaders = NonNullable<Argument<Client['getCustomerOrders']>>['headers']
type UseCustomerOrdersArg = {
    headers?: UseCustomerOrdersHeaders
    rawResponse?: boolean
} & UseCustomerOrdersParameters
/**
 * A hook for `ShopperCustomers#getCustomerOrders`.
 * Returns a pageable list of all customer's orders. The default page size is 10.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerOrders} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerorders} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useCustomerOrders(
    arg: Omit<UseCustomerOrdersArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getCustomerOrders']> | Response, Error>
): UseQueryResult<DataType<Client['getCustomerOrders']>, Error>
function useCustomerOrders(
    arg: Omit<UseCustomerOrdersArg, 'rawResponse'> & {rawResponse?: true},
    options?: UseQueryOptions<DataType<Client['getCustomerOrders']> | Response, Error>
): UseQueryResult<DataType<Client['getCustomerOrders']>, Error>
function useCustomerOrders(
    arg: UseCustomerOrdersArg,
    options?: UseQueryOptions<DataType<Client['getCustomerOrders']> | Response, Error>
) {
    const {headers, rawResponse, ...parameters} = arg
    return useQuery(
        ['/customers', parameters.customerId, '/orders', arg],
        (_, {shopperCustomers}) => {
            return shopperCustomers.getCustomerOrders({parameters, headers}, rawResponse)
        },
        options
    )
}

/**
 * WARNING: This method is not implemented yet.
 *
 * A hook for `ShopperCustomers#getCustomerPaymentInstrument`.
 * Retrieves a customer's payment instrument by its ID.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerPaymentInstrument} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerpaymentinstrument} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useCustomerPaymentInstrument(): void {
    NotImplementedError()
}

type UseCustomerProductListsParameters = NonNullable<
    Argument<Client['getCustomerProductLists']>
>['parameters']
type UseCustomerProductListsHeaders = NonNullable<
    Argument<Client['getCustomerProductLists']>
>['headers']
type UseCustomerProductListsArg = {
    headers?: UseCustomerProductListsHeaders
    rawResponse?: boolean
} & UseCustomerProductListsParameters

/**
 * A hook for `ShopperCustomers#getCustomerProductLists`.
 * Returns all customer product lists.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductLists} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlists} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useCustomerProductLists(
    arg: Omit<UseCustomerProductListsArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getCustomerProductLists']> | Response, Error>
): UseQueryResult<DataType<Client['getCustomerProductLists']>, Error>
function useCustomerProductLists(
    arg: Omit<UseCustomerProductListsArg, 'rawResponse'> & {rawResponse?: true},
    options?: UseQueryOptions<DataType<Client['getCustomerProductLists']> | Response, Error>
): UseQueryResult<DataType<Client['getCustomerProductLists']>, Error>
function useCustomerProductLists(
    arg: UseCustomerProductListsArg,
    options?: UseQueryOptions<DataType<Client['getCustomerProductLists']> | Response, Error>
) {
    const {headers, rawResponse, ...parameters} = arg
    return useQuery(
        ['/customers', parameters.customerId, '/product-lists', arg],
        (_, {shopperCustomers}) => {
            return shopperCustomers.getCustomerProductLists({parameters, headers}, rawResponse)
        },
        options
    )
}

type UseCustomerProductListParameters = NonNullable<
    Argument<Client['getCustomerProductList']>
>['parameters']
type UseCustomerProductListHeaders = NonNullable<
    Argument<Client['getCustomerProductList']>
>['headers']
type UseCustomerProductListArg = {
    headers?: UseCustomerProductListHeaders
    rawResponse?: boolean
} & UseCustomerProductListParameters
/**
 * A hook for `ShopperCustomers#getCustomerProductList`.
 * Returns a customer product list of the given customer and the items in the list.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductList} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlist} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useCustomerProductList(
    arg: Omit<UseCustomerProductListArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getCustomerProductList']> | Response, Error>
): UseQueryResult<DataType<Client['getCustomerProductList']>, Error>
function useCustomerProductList(
    arg: Omit<UseCustomerProductListArg, 'rawResponse'> & {rawResponse?: true},
    options?: UseQueryOptions<DataType<Client['getCustomerProductList']> | Response, Error>
): UseQueryResult<DataType<Client['getCustomerProductList']>, Error>
function useCustomerProductList(
    arg: UseCustomerProductListArg,
    options?: UseQueryOptions<DataType<Client['getCustomerProductList']> | Response, Error>
) {
    const {headers, rawResponse, ...parameters} = arg
    return useQuery(
        ['/customers', parameters.customerId, '/product-list', parameters.listId, arg],
        (_, {shopperCustomers}) => {
            return shopperCustomers.getCustomerProductList({parameters, headers}, rawResponse)
        },
        options
    )
}

/**
 * WARNING: This method is not implemented yet.
 *
 * A hook for `ShopperCustomers#getCustomerProductListItem`.
 * Returns an item of a customer product list and the actual product details like image, availability and price.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductListItem} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlistitem} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useCustomerProductListItem(): void {
    NotImplementedError()
}
/**
 * WARNING: This method is not implemented yet.
 *
 * A hook for `ShopperCustomers#getPublicProductListsBySearchTerm`.
 * Retrieves all public product lists as defined by the given search term (for example, email OR first name and last name).
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getPublicProductListsBySearchTerm} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getpublicproductlistsbysearchterm} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function usePublicProductListsBySearchTerm(): void {
    NotImplementedError()
}
/**
 * WARNING: This method is not implemented yet.
 *
 * A hook for `ShopperCustomers#getPublicProductList`.
 * Retrieves a public product list by ID and the items under that product list.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getPublicProductList} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getpublicproductlist} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function usePublicProductList(): void {
    NotImplementedError()
}
/**
 * WARNING: This method is not implemented yet.
 *
 * A hook for `ShopperCustomers#getProductListItem`.
 * Retrieves an item from a public product list and the actual product details like product, image, availability and price.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getProductListItem} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getproductlistitem} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function useProductListItem(): void {
    NotImplementedError()
}

export {
    useExternalProfile,
    useCustomer,
    useCustomerAddress,
    useCustomerBaskets,
    useCustomerOrders,
    useCustomerPaymentInstrument,
    useCustomerProductLists,
    useCustomerProductList,
    useCustomerProductListItem,
    usePublicProductListsBySearchTerm,
    usePublicProductList,
    useProductListItem
}
