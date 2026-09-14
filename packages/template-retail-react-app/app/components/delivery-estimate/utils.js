/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const getTime = (value) => {
    const time = new Date(value).getTime()
    return Number.isFinite(time) ? time : null
}

const isEligibleShippingOption = (shippingOption) => {
    const deliveryWindow = shippingOption?.deliveryWindow
    const startAt = getTime(deliveryWindow?.startAt)
    const endAt = getTime(deliveryWindow?.endAt)
    return (
        !shippingOption?.nonDeliverableReason &&
        deliveryWindow &&
        startAt !== null &&
        endAt !== null &&
        startAt <= endAt
    )
}

const compareBySlowestDeliveryWindow = (first, second) => {
    const startDifference =
        getTime(second.deliveryWindow.startAt) - getTime(first.deliveryWindow.startAt)
    if (startDifference !== 0) return startDifference

    const endDifference = getTime(second.deliveryWindow.endAt) - getTime(first.deliveryWindow.endAt)
    if (endDifference !== 0) return endDifference

    return String(first.shippingMethodId || '').localeCompare(String(second.shippingMethodId || ''))
}

/**
 * Returns the slowest eligible shipping option for the requested product.
 * The PDP summary follows Storefront Next by selecting the latest window start,
 * then the latest end time as a deterministic tie-breaker.
 */
export const getSlowestDeliveryEstimate = (productId, deliveryEstimates) => {
    const productEstimate = deliveryEstimates?.productDeliveryEstimates?.find(
        (estimate) => estimate.productId === productId
    )
    const eligibleOptions = productEstimate?.shippingOptions?.filter(isEligibleShippingOption) || []

    if (!eligibleOptions.length) return null

    return [...eligibleOptions].sort(compareBySlowestDeliveryWindow)[0]
}

export const normalizeDestination = (destination) => {
    const {countryCode, postalCode} = destination || {}
    return {
        countryCode: countryCode?.trim().toUpperCase() || '',
        postalCode: postalCode?.trim() || ''
    }
}

export const isValidDestination = (destination) => {
    const {countryCode, postalCode} = destination || {}
    return /^[A-Z]{2}$/.test(countryCode) && typeof postalCode === 'string' && postalCode.length > 0
}

export const getStoredDestination = (storageKey) => {
    try {
        const value = window.localStorage.getItem(storageKey)
        if (!value) return null

        const destination = normalizeDestination(JSON.parse(value))
        return isValidDestination(destination) ? destination : null
    } catch {
        return null
    }
}
