/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect, useState} from 'react'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {deleteTemporaryBasket} from '@salesforce/retail-react-app/app/components/express/utils/pdp/temporary-basket'

/**
 * Shared hook for express payment components setup
 * Handles common logic like SKU changes, temporary basket management, and validation
 */
export const useExpressPaymentSetup = ({
    sku,
    isPdpMode = false,
    basket,
    authToken,
    refreshToken,
    tokenProvider,
    updateTokens,
    locale: providedLocale,
    site: providedSite
}) => {
    const {locale: hookLocale, site: hookSite} = useMultiSite()

    // Use provided values from parent, fallback to hooks
    const locale = providedLocale || hookLocale
    const site = providedSite || hookSite

    const [tempBasket, setTempBasket] = useState(null)
    const [currentSku, setCurrentSku] = useState(sku)

    // Check if we have the minimum required basket data (from basket only)
    const hasRequiredBasketData = basket && basket.orderTotal && basket.currency && basket.basketId

    // Handle SKU prop changes (for postMessage updates)
    useEffect(() => {
        if (sku !== currentSku) {
            // Clean up previous temporary basket if switching SKUs
            if (currentSku && tempBasket?.basketId && authToken && site) {
                deleteTemporaryBasket(tempBasket.basketId, authToken, refreshToken, site, updateTokens, tokenProvider).catch((error) =>
                    console.warn('Failed to cleanup previous temporary basket:', error)
                )
                setTempBasket(null)
            }
            setCurrentSku(sku)
        }
    }, [sku, currentSku, tempBasket?.basketId, authToken, site])

    // Cleanup effect to remove temporary basket when component unmounts
    useEffect(() => {
        return () => {
            // Clean up temporary basket when component unmounts (user navigates away)
            if (isPdpMode && currentSku && tempBasket?.basketId && authToken && site) {
                deleteTemporaryBasket(tempBasket.basketId, authToken, refreshToken, site, updateTokens, tokenProvider).catch((error) =>
                    console.warn('Failed to cleanup temporary basket on unmount:', error)
                )
            }
        }
    }, [tempBasket?.basketId, authToken, site?.id, currentSku, isPdpMode])

    return {
        locale,
        site,
        tempBasket,
        setTempBasket,
        currentSku,
        hasRequiredBasketData
    }
}
