/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCustomerId, useCustomerBaskets} from '@salesforce/commerce-sdk-react'
import {useShopperBasketsV2Mutation as useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {isServer} from '@salesforce/retail-react-app/app/utils/utils'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'

/**
 * Hook to clean up temporary baskets
 * @returns {Function} cleanupTemporaryBaskets - Function to clean up temporary baskets
 */
export const useCleanupTemporaryBaskets = () => {
    const customerId = useCustomerId()
    const {data: basketsData, refetch: refetchBaskets} = useCustomerBaskets(
        {parameters: {customerId}},
        {
            enabled: !!customerId && !isServer,
            keepPreviousData: true
        }
    )
    const {mutateAsync: deleteBasket} = useShopperBasketsMutation('deleteBasket')

    const cleanupTemporaryBaskets = async () => {
        if (customerId && basketsData?.baskets && basketsData.baskets.length > 0) {
            const temporaryBaskets = basketsData.baskets.filter(
                (basket) => basket.temporaryBasket === true
            )
            if (temporaryBaskets.length > 0) {
                // Clean up in parallel
                await Promise.all(
                    temporaryBaskets.map((basket) =>
                        deleteBasket({
                            parameters: {basketId: basket.basketId}
                        }).catch((error) => {
                            // Only log if it's not a "Basket Not Found" error
                            if (error?.response?.status !== 404) {
                                logger.error(
                                    `Error deleting temporary basket ${basket.basketId}:`,
                                    {
                                        namespace: 'useCleanupTemporaryBaskets'
                                    }
                                )
                            }
                        })
                    )
                )
                // Refetch after cleanup completes
                refetchBaskets()
            }
        }
    }

    return cleanupTemporaryBaskets
}
