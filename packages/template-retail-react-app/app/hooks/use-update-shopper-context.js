/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'
import {useLocation} from 'react-router-dom'
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
import {useShopperContextSearchParams} from '@salesforce/retail-react-app/../../app/hooks/use-shopper-context-search-params'

/*
 * This hook will set the shopper context when search params pertinant
 * to shopper context are present.
 */
export const useUpdateShopperContext = () => {
    const {site} = useMultiSite()
    const {usid} = useUsid()
    const {search} = useLocation()
    const queryClient = useQueryClient()
    const createShopperContext = useShopperContextsMutation('createShopperContext')
    const updateShopperContext = useShopperContextsMutation('updateShopperContext')
    const {data: shopperContext} = useShopperContext(
        {parameters: {usid, siteId: site.id}},
        {enabled: !isServer}
    )
    console.log('shopperContext', shopperContext)

    const refetchDataOnClient = () => {
        queryClient.invalidateQueries()
    }

    const handleShopperContextUpdate = async (updateShopperContextObj) => {
        if (Object.keys(updateShopperContextObj).length === 0) {
            return
        }

        const payload = {
            parameters: {usid, siteId: site.id},
            body: updateShopperContextObj
        }
        if (!shopperContext) {
            await createShopperContext.mutateAsync(payload)
        } else {
            await updateShopperContext.mutateAsync(payload)
            console.log('updated shopperContext', updateShopperContextObj)
        }

        // Refresh data
        refetchDataOnClient()
    }

    // Handle updating the shopper context based on URL search params
    const updateShopperContextObj = useShopperContextSearchParams()
    useEffect(() => {
        handleShopperContextUpdate(updateShopperContextObj)
    }, [search])

    useEffect(() => {
        console.log('isHydrated()', isHydrated())
        if (isHydrated()) {
            refetchDataOnClient()
        }
    }, [])
}
