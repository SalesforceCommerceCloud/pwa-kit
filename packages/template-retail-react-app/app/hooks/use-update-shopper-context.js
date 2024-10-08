/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import isEqual from 'lodash/isEqual'
import {useEffect, useState} from 'react'
import {
    useUsid,
    useShopperContext,
    useShopperContextsMutation
} from '@salesforce/commerce-sdk-react'
import {isServer, isHydrated} from '@salesforce/retail-react-app/app/utils/utils'

// Hooks
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'

// Constants
import {useShopperContextSearchParams} from '@salesforce/retail-react-app/app/hooks/use-shopper-context-search-params'

/*
 * This hook will set the shopper context when search params pertinant
 * to shopper context are present.
 */
export const useUpdateShopperContext = () => {
    const [isUpdating, setIsUpdating] = useState(false);
    const {site} = useMultiSite()
    const {usid} = useUsid()
    const createShopperContext = useShopperContextsMutation('createShopperContext')
    const updateShopperContext = useShopperContextsMutation('updateShopperContext')
    const {data: shopperContext, isLoading, refetch} = useShopperContext(
        {parameters: {usid, siteId: site.id}},
        {enabled: !isServer}
    )

    // Handle updating the shopper context based on URL search params
    const shopperContextFromSearchParams = useShopperContextSearchParams()

    const handleShopperContextUpdate = async (shopperContext, newShopperContext) => {
        const payload = {
            parameters: {usid, siteId: site.id},
            body: newShopperContext
        }
        if (!shopperContext) {
            await createShopperContext.mutateAsync(payload)
        } else {
            await updateShopperContext.mutateAsync(payload)
        }
        await refetch()
    }

    useEffect(() => {
        const shouldUpdateShopperContext =
            !isLoading &&
            Object.keys(shopperContextFromSearchParams).length > 0 &&
            !isEqual(shopperContext, shopperContextFromSearchParams)

        if (shouldUpdateShopperContext) {
            setIsUpdating(true)
            handleShopperContextUpdate(shopperContext, shopperContextFromSearchParams)
        } else if (shopperContext) {
            setIsUpdating(false)
        }
    }, [isLoading, shopperContext, shopperContextFromSearchParams])

    return {shopperContext, isUpdating}
}
