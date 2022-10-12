/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType} from '../types'
import {useQuery} from '../useQuery'
import useCommerceApi from '../useCommerceApi'
import {UseQueryResult} from '@tanstack/react-query'

type Client = ApiClients['shopperCustomers']

/**
 * A hook for `ShopperCustomers#getExternalProfile`.
 * Gets the new external profile for a customer.This endpoint is in closed beta, available to select few customers. Please get in touch with your Account Team if you'd like to participate in the beta program
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getExternalProfile} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getexternalprofile} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useExternalProfile = (
    arg: Argument<Client['getExternalProfile']>
): UseQueryResult<DataType<Client['getExternalProfile']>, Error> => {
    const {shopperCustomers: client} = useCommerceApi()
    return useQuery(['external-profile', arg], () => client.getExternalProfile(arg))
}
/**
 * A hook for `ShopperCustomers#getCustomer`.
 * Gets a customer with all existing addresses and payment instruments associated with the requested customer.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomer} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomer} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCustomer = (
    arg: Argument<Client['getCustomer']>
): UseQueryResult<DataType<Client['getCustomer']>> => {
    const {shopperCustomers: client} = useCommerceApi()
    return useQuery(['customer', arg], () => client.getCustomer(arg))
}
/**
 * A hook for `ShopperCustomers#getCustomerAddress`.
 * Retrieves a customer's address by address name.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerAddress} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomeraddress} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCustomerAddress = (
    arg: Argument<Client['getCustomerAddress']>
): UseQueryResult<DataType<Client['getCustomerAddress']>, Error> => {
    const {shopperCustomers: client} = useCommerceApi()
    return useQuery(['address', arg], () => client.getCustomerAddress(arg))
}
/**
 * A hook for `ShopperCustomers#getCustomerBaskets`.
 * Gets the baskets of a customer.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerBaskets} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerbaskets} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCustomerBaskets = (
    arg: Argument<Client['getCustomerBaskets']>
): UseQueryResult<DataType<Client['getCustomerBaskets']>, Error> => {
    const {shopperCustomers: client} = useCommerceApi()
    return useQuery(['baskets', arg], () => client.getCustomerBaskets(arg))
}
/**
 * A hook for `ShopperCustomers#getCustomerOrders`.
 * Returns a pageable list of all customer's orders. The default page size is 10.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerOrders} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerorders} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCustomerOrders = (
    arg: Argument<Client['getCustomerOrders']>
): UseQueryResult<DataType<Client['getCustomerOrders']>, Error> => {
    const {shopperCustomers: client} = useCommerceApi()
    return useQuery(['orders', arg], () => client.getCustomerOrders(arg))
}
/**
 * A hook for `ShopperCustomers#getCustomerPaymentInstrument`.
 * Retrieves a customer's payment instrument by its ID.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerPaymentInstrument} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerpaymentinstrument} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCustomerPaymentInstrument = (
    arg: Argument<Client['getCustomerPaymentInstrument']>
): UseQueryResult<DataType<Client['getCustomerPaymentInstrument']>, Error> => {
    const {shopperCustomers: client} = useCommerceApi()
    return useQuery(['payment-instrument', arg], () => client.getCustomerPaymentInstrument(arg))
}
/**
 * A hook for `ShopperCustomers#getCustomerProductLists`.
 * Returns all customer product lists.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductLists} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlists} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCustomerProductLists = (
    arg: Argument<Client['getCustomerProductLists']>
): UseQueryResult<DataType<Client['getCustomerProductLists']>, Error> => {
    const {shopperCustomers: client} = useCommerceApi()
    return useQuery(['product-lists', arg], () => client.getCustomerProductLists(arg))
}
/**
 * A hook for `ShopperCustomers#getCustomerProductList`.
 * Returns a customer product list of the given customer and the items in the list.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductList} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlist} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCustomerProductList = (
    arg: Argument<Client['getCustomerProductList']>
): UseQueryResult<DataType<Client['getCustomerProductList']>, Error> => {
    const {shopperCustomers: client} = useCommerceApi()
    return useQuery(['product-list', arg], () => client.getCustomerProductList(arg))
}
/**
 * A hook for `ShopperCustomers#getCustomerProductListItem`.
 * Returns an item of a customer product list and the actual product details like image, availability and price.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getCustomerProductListItem} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getcustomerproductlistitem} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useCustomerProductListItem = (
    arg: Argument<Client['getCustomerProductListItem']>
): UseQueryResult<DataType<Client['getCustomerProductListItem']>, Error> => {
    const {shopperCustomers: client} = useCommerceApi()
    return useQuery(['product-list-item', arg], () => client.getCustomerProductListItem(arg))
}
/**
 * A hook for `ShopperCustomers#getPublicProductListsBySearchTerm`.
 * Retrieves all public product lists as defined by the given search term (for example, email OR first name and last name).
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getPublicProductListsBySearchTerm} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getpublicproductlistsbysearchterm} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePublicProductListsBySearchTerm = (
    arg: Argument<Client['getPublicProductListsBySearchTerm']>
): UseQueryResult<DataType<Client['getPublicProductListsBySearchTerm']>, Error> => {
    const {shopperCustomers: client} = useCommerceApi()
    return useQuery(['product-list-by-search-term', arg], () =>
        client.getPublicProductListsBySearchTerm(arg)
    )
}
/**
 * A hook for `ShopperCustomers#getPublicProductList`.
 * Retrieves a public product list by ID and the items under that product list.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getPublicProductList} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getpublicproductlist} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const usePublicProductList = (
    arg: Argument<Client['getPublicProductList']>
): UseQueryResult<DataType<Client['getPublicProductList']>, Error> => {
    const {shopperCustomers: client} = useCommerceApi()
    return useQuery(['public-product-list', arg], () => client.getPublicProductList(arg))
}
/**
 * A hook for `ShopperCustomers#getProductListItem`.
 * Retrieves an item from a public product list and the actual product details like product, image, availability and price.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-customers?meta=getProductListItem} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shoppercustomers.shoppercustomers-1.html#getproductlistitem} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
export const useProductListItem = (
    arg: Argument<Client['getProductListItem']>
): UseQueryResult<DataType<Client['getProductListItem']>, Error> => {
    const {shopperCustomers: client} = useCommerceApi()
    return useQuery(['product-list-item', arg], () => client.getProductListItem(arg))
}
