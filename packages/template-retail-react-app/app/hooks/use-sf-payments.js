/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useSyncExternalStore} from 'react'
import {useQuery} from '@tanstack/react-query'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import useScript from '@salesforce/retail-react-app/app/hooks/use-script'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import {useShopperConfiguration} from '@salesforce/retail-react-app/app/hooks/use-shopper-configuration'

export const EXPRESS_BUY_NOW = 0
export const EXPRESS_PAY_NOW = 1

export const STATUS_SUCCESS = 0

export const store = {
    sfp: null,
    confirmingBasket: null
}
const subscribers = new Set()

export const useSFPayments = () => {
    const appOrigin = useAppOrigin()

    // Add script tag to page if not already present
    const config = getConfig()
    const sdkUrl = config?.app?.sfPayments?.sdkUrl
    const status = useScript(sdkUrl)

    useEffect(() => {
        if (
            typeof window !== 'undefined' &&
            status.loaded &&
            !store.sfp &&
            typeof window.SFPayments === 'function'
        ) {
            // Create SFPayments object when script loaded
            store.sfp = new window.SFPayments()
        }
    }, [status.loaded])

    const {data: serverMetadata, isLoading: serverMetadataLoading} = useQuery({
        queryKey: ['payment-metadata'],
        queryFn: async () => {
            const response = await fetch(`${appOrigin}/api/payment-metadata`)
            if (!response.ok) {
                throw new Error('Failed to load payment metadata')
            }
            return await response.json()
        },
        staleTime: 10 * 60 * 1000 // 10 minutes
    })

    const subscribe = (callback) => {
        subscribers.add(callback)
        return () => subscribers.delete(callback)
    }
    const notify = () => subscribers.forEach((callback) => callback())
    const globals = useSyncExternalStore(
        subscribe,
        () => store,
        () => ({})
    )
    // Separate subscription for confirmingBasket to ensure React detects changes
    // The issue is that useSyncExternalStore compares snapshot values with Object.is().
    // When the snapshot returns the entire store object, the reference stays the same,
    // so React doesn't detect the change to store.confirmingBasket.
    const confirmingBasket = useSyncExternalStore(
        subscribe,
        () => store.confirmingBasket, // Return just the value so React detects the change
        () => null // Server snapshot
    )

    const startConfirming = (basket) => {
        store.confirmingBasket = basket
        notify()
    }
    const endConfirming = () => {
        store.confirmingBasket = null
        notify()
    }

    return {
        sfp: globals.sfp,
        metadata: serverMetadata,
        isMetadataLoading: serverMetadataLoading,
        confirmingBasket: confirmingBasket,
        startConfirming,
        endConfirming
    }
}

/**
 * Custom hook to check if Salesforce Payments is enabled
 * @returns {boolean} True if Salesforce Payments is enabled, false otherwise
 */
export const useSFPaymentsEnabled = () => {
    return useShopperConfiguration('SalesforcePaymentsAllowed') === true
}

/**
 * Custom hook to get the card capture mode for Salesforce Payments
 * @returns {boolean} True if automatic capture is enabled (default), false if manual capture
 */
export const useAutomaticCapture = () => {
    const cardCaptureAutomatic = useShopperConfiguration('cardCaptureAutomatic')
    return cardCaptureAutomatic ?? true
}
