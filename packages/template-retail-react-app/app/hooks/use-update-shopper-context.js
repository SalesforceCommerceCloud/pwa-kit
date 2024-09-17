/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import _ from 'lodash'
import {useEffect} from 'react'
import {
    useUsid,
    useShopperContext,
    useShopperContextsMutation
} from '@salesforce/commerce-sdk-react'
import {isServer, isHydrated} from '@salesforce/retail-react-app/app/utils/utils'
import {useQueryClient} from '@tanstack/react-query'

// Hooks
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

// Constants
import {useShopperContextSearchParams} from '@salesforce/retail-react-app/app/hooks/use-shopper-context-search-params'

/*
 * This hook will set the shopper context when search params pertinant
 * to shopper context are present.
 */
export const useUpdateShopperContext = () => {
    const {site} = useMultiSite()
    const {usid} = useUsid()
    const queryClient = useQueryClient()
    const createShopperContext = useShopperContextsMutation('createShopperContext')
    const updateShopperContext = useShopperContextsMutation('updateShopperContext')
    const {data: shopperContext, isLoading} = useShopperContext(
        {parameters: {usid, siteId: site.id}},
        {enabled: !isServer}
    )
    // Handle updating the shopper context based on URL search params
    let shopperContextFromSearchParams = useShopperContextSearchParams()

    const refetchDataOnClient = () => {
        queryClient.invalidateQueries()
    }

    const handleShopperContextUpdate = async (shopperContextFromSearchParams) => {
        const payload = {
            parameters: {usid, siteId: site.id},
            body: shopperContextFromSearchParams
        }
        if (!shopperContext) {
            await createShopperContext.mutateAsync(payload)
        } else {
            await updateShopperContext.mutateAsync(payload)
        }

        // Clear the shopper context from search params to trigger a data refetch
        shopperContextFromSearchParams = {}
    }

    useEffect(() => {
        const requiresShopperContextUpdates =
            !isLoading &&
            Object.keys(shopperContextFromSearchParams).length > 0 &&
            !_.isEqual(shopperContext, shopperContextFromSearchParams)
    
        if (requiresShopperContextUpdates) {
            handleShopperContextUpdate(shopperContextFromSearchParams)
        } else if (shopperContext && isHydrated()) {
            refetchDataOnClient()
        }
    }, [isLoading, shopperContext, shopperContextFromSearchParams])
}
