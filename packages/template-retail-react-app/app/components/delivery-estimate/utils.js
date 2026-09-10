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

const compareByDeliveryWindow = (first, second) => {
    const endDifference = getTime(first.deliveryWindow.endAt) - getTime(second.deliveryWindow.endAt)
    if (endDifference !== 0) return endDifference

    const startDifference =
        getTime(first.deliveryWindow.startAt) - getTime(second.deliveryWindow.startAt)
    if (startDifference !== 0) return startDifference

    return String(first.shippingMethodId || '').localeCompare(String(second.shippingMethodId || ''))
}

/**
 * Returns the primary eligible shipping option for the requested product.
 *
 * A priced option is always preferred. Among priced options, the lowest finite
 * price wins; delivery-window ordering makes ties deterministic. When every
 * eligible option has no price, the earliest delivery-window end wins.
 */
export const getPrimaryDeliveryEstimate = (productId, deliveryEstimates) => {
    const productEstimate = deliveryEstimates?.productDeliveryEstimates?.find(
        (estimate) => estimate.productId === productId
    )
    const eligibleOptions = productEstimate?.shippingOptions?.filter(isEligibleShippingOption) || []

    if (!eligibleOptions.length) return null

    const pricedOptions = eligibleOptions.filter((option) => Number.isFinite(option.price))
    if (!pricedOptions.length) {
        return [...eligibleOptions].sort(compareByDeliveryWindow)[0]
    }

    return [...pricedOptions].sort((first, second) => {
        const priceDifference = first.price - second.price
        return priceDifference || compareByDeliveryWindow(first, second)
    })[0]
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
