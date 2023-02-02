/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApiClients, Argument, DataType} from '../types'
import {useQuery} from '../useQuery'
import {UseQueryOptions, UseQueryResult} from '@tanstack/react-query'
import useConfig from '../useConfig'

type Client = ApiClients['shopperExperience']

type UsePagesParameters = NonNullable<Argument<Client['getPages']>>['parameters']
type UsePagesHeaders = NonNullable<Argument<Client['getPages']>>['headers']
type UsePagesArg = {headers?: UsePagesHeaders; rawResponse?: boolean} & UsePagesParameters
/**
 * A hook for `ShopperExperience#getPages`.
 * Get Page Designer pages. The results will apply the visibility rules for each page's components, such as personalization or scheduled visibility.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-experience?meta=getPages} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperexperience.shopperexperience-1.html#getpages} for more information on the parameters and returned data type.
 * @returns An object describing the state of the request.
 */
function usePages(
    arg: Omit<UsePagesArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getPages']> | Response, Error>
): UseQueryResult<DataType<Client['getPages']>, Error>
function usePages(
    arg: Omit<UsePagesArg, 'rawResponse'> & {rawResponse: true},
    options?: UseQueryOptions<DataType<Client['getPages']> | Response, Error>
): UseQueryResult<Response, Error>
function usePages(
    arg: UsePagesArg,
    options?: UseQueryOptions<DataType<Client['getPages']> | Response, Error>
): UseQueryResult<DataType<Client['getPages']> | Response, Error> {
    const {headers, rawResponse, ...parameters} = arg
    const {locale} = useConfig()
    parameters.locale = parameters.locale || locale
    return useQuery(
        ['/pages', arg],
        (_, {shopperExperience}) => {
            return shopperExperience.getPages({parameters, headers}, rawResponse)
        },
        options
    )
}

type UsePageParameters = NonNullable<Argument<Client['getPage']>>['parameters']
type UsePageHeaders = NonNullable<Argument<Client['getPage']>>['headers']
type UsePageArg = {headers?: UsePageHeaders; rawResponse?: boolean} & UsePageParameters
/**
 * A hook for `ShopperExperience#getPage`.
 * Get a Page Designer page based on a single page ID. The results will apply the visibility rules for the page's components, such as personalization or scheduled visibility.
 * @see {@link https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-experience?meta=getPage} for more information about the API endpoint.
 * @see {@link https://salesforcecommercecloud.github.io/commerce-sdk-isomorphic/classes/shopperexperience.shopperexperience-1.html#getpage} for more information on the parameters and returned data type.
 * @returns A promise of type Page.
 */
function usePage(
    arg: Omit<UsePageArg, 'rawResponse'> & {rawResponse?: false},
    options?: UseQueryOptions<DataType<Client['getPage']> | Response, Error>
): UseQueryResult<DataType<Client['getPage']>, Error>
function usePage(
    arg: Omit<UsePageArg, 'rawResponse'> & {rawResponse: true},
    options?: UseQueryOptions<DataType<Client['getPage']> | Response, Error>
): UseQueryResult<Response, Error>
function usePage(
    arg: UsePageArg,
    options?: UseQueryOptions<DataType<Client['getPage']> | Response, Error>
): UseQueryResult<DataType<Client['getPage']> | Response, Error> {
    const {headers, rawResponse, ...parameters} = arg
    const {locale, currency} = useConfig()
    parameters.locale = parameters.locale || locale
    return useQuery(
        ['/page', arg],
        (_, {shopperExperience}) => {
            return shopperExperience.getPage({parameters, headers}, rawResponse)
        },
        options
    )
}

export {usePages, usePage}
