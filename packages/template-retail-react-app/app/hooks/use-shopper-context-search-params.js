/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'
import {useLocation} from 'react-router-dom'
import {useUsid, useShopperContext, useShopperContextsMutation} from '@salesforce/commerce-sdk-react'
import {isServer, isHydrated} from '@salesforce/retail-react-app/app/utils/utils'
import {useQueryClient} from '@tanstack/react-query'

// Constants
import {
    SHOPPER_CONTEXT_SEARCH_PARAMS,
    SHOPPER_CONTEXT_CUSTOM_QUALIFIERS_SEARCH_PARAMS,
    SHOPPER_CONTEXT_ASSIGNMENT_QUALIFIERS_SEARCH_PARAMS,
    SHOPPER_CONTEXT_ARRAY_FIELDS
} from '@salesforce/retail-react-app/app/constants'

/*
 * This hook will set the shopper context when search params pertinant
 * to shopper context are present.
 */
export const useShopperContextSearchParams = (siteId, arraySearchParams = SHOPPER_CONTEXT_ARRAY_FIELDS) => {
    const {usid} = useUsid()
    const queryClient = useQueryClient()
    const {search} = useLocation()
    const searchParamsObj = new URLSearchParams(search)
    const createShopperContext = useShopperContextsMutation('createShopperContext')
    const updateShopperContext = useShopperContextsMutation('updateShopperContext')
    const {data: shopperContext} = useShopperContext(
        {
            parameters: {usid, siteId}
        },
        {
            enabled: !isServer,
            onError: async () => {
                await createShopperContext.mutateAsync({
                    parameters: {usid, siteId},
                    body: {}
                })
            }
        }
    )
    console.log('shopperContext', shopperContext)
    const updatedShopperContext = getShopperContextSearchParams(searchParamsObj, arraySearchParams)
    console.log('updatedshopperContext', updatedShopperContext)
    const refetchDataOnClient = () => {
        queryClient.invalidateQueries()
    }

    useEffect(() => {
        const executeShopperContextUpdate = async (usid, siteId, updatedShopperContext) => {
            // update the shopper context if the query string contains the relevant search parameters
            await updateShopperContext.mutateAsync({
                parameters: {usid, siteId: siteId},
                body: updatedShopperContext
            })
            // Refresh to update the data on the page
            refetchDataOnClient()
        }
        executeShopperContextUpdate(usid, siteId, updatedShopperContext)
    }, [search])

    useEffect(() => {
        console.log('isHydrated()', isHydrated())
        if (isHydrated()) {
            refetchDataOnClient()
        }
    }, [])
}

export const getShopperContextSearchParams = (searchParamsObj, arraySearchParams = SHOPPER_CONTEXT_ARRAY_FIELDS) => {
    const getSearchParam = (key, isList = false) =>
        searchParamsObj.has(key)
            ? {[key]: isList ? searchParamsObj.getAll(key) : searchParamsObj.get(key)}
            : {}

    const reduceParams = (keys) =>
        keys.reduce(
            (acc, key) => ({...acc, ...getSearchParam(key, arraySearchParams.includes(key))}),
            {}
        )

    const customQualifiers = reduceParams(
        Object.values(SHOPPER_CONTEXT_CUSTOM_QUALIFIERS_SEARCH_PARAMS)
    )
    const assignmentQualifiers = reduceParams(
        Object.values(SHOPPER_CONTEXT_ASSIGNMENT_QUALIFIERS_SEARCH_PARAMS)
    )
    const shopperContextSearchParams = reduceParams(Object.values(SHOPPER_CONTEXT_SEARCH_PARAMS))

    return {
        ...shopperContextSearchParams,
        ...(Object.keys(customQualifiers).length && {customQualifiers}),
        ...(Object.keys(assignmentQualifiers).length && {assignmentQualifiers})
    }
}
