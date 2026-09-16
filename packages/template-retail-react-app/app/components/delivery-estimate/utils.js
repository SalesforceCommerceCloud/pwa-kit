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

const PICKUP_SHIPPING_METHOD_ID = '005'

const stripAndUpper = (maxLength) => (value) =>
    value
        .replace(/[^A-Za-z0-9]/g, '')
        .toUpperCase()
        .slice(0, maxLength)

const normalizeGB = (value) => {
    const postalCode = stripAndUpper(7)(value)
    return postalCode.length < 5
        ? postalCode
        : `${postalCode.slice(0, postalCode.length - 3)} ${postalCode.slice(-3)}`
}

const postalCodeFormats = {
    US: {
        regex: /^\d{5}(-\d{4})?$/,
        normalize: (value) =>
            value
                .replace(/[^\d-]/g, '')
                .replace(/^-+|-+$/g, '')
                .slice(0, 10),
        inputMode: 'numeric',
        maxLength: 10
    },
    CA: {
        regex: /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJKLMNPRSTVXY] \d[ABCEGHJKLMNPRSTVXY]\d$/,
        normalize: (value) => {
            const postalCode = stripAndUpper(6)(value)
            return postalCode.length > 3
                ? `${postalCode.slice(0, 3)} ${postalCode.slice(3)}`
                : postalCode
        },
        inputMode: 'text',
        maxLength: 7
    },
    GB: {
        regex: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/,
        normalize: normalizeGB,
        inputMode: 'text',
        maxLength: 8
    },
    IE: {
        regex: /^[A-Z]\d{2} [A-Z\d]{4}$/,
        normalize: (value) => {
            const postalCode = stripAndUpper(7)(value)
            return postalCode.length > 3
                ? `${postalCode.slice(0, 3)} ${postalCode.slice(3)}`
                : postalCode
        },
        inputMode: 'text',
        maxLength: 8
    },
    IT: {
        regex: /^\d{5}$/,
        normalize: (value) => value.replace(/\D/g, '').slice(0, 5),
        inputMode: 'numeric',
        maxLength: 5
    },
    DE: {
        regex: /^\d{5}$/,
        normalize: (value) => value.replace(/\D/g, '').slice(0, 5),
        inputMode: 'numeric',
        maxLength: 5
    },
    FR: {
        regex: /^\d{5}$/,
        normalize: (value) => value.replace(/\D/g, '').slice(0, 5),
        inputMode: 'numeric',
        maxLength: 5
    },
    ES: {
        regex: /^\d{5}$/,
        normalize: (value) => value.replace(/\D/g, '').slice(0, 5),
        inputMode: 'numeric',
        maxLength: 5
    },
    NL: {
        regex: /^\d{4} [A-Z]{2}$/,
        normalize: (value) => {
            const postalCode = stripAndUpper(6)(value)
            return postalCode.length > 4
                ? `${postalCode.slice(0, 4)} ${postalCode.slice(4)}`
                : postalCode
        },
        inputMode: 'text',
        maxLength: 7
    },
    JP: {
        regex: /^\d{3}-\d{4}$/,
        normalize: (value) => {
            const postalCode = value.replace(/\D/g, '').slice(0, 7)
            return postalCode.length > 3
                ? `${postalCode.slice(0, 3)}-${postalCode.slice(3)}`
                : postalCode
        },
        inputMode: 'numeric',
        maxLength: 8
    },
    CN: {
        regex: /^\d{6}$/,
        normalize: (value) => value.replace(/\D/g, '').slice(0, 6),
        inputMode: 'numeric',
        maxLength: 6
    },
    TW: {
        regex: /^\d{3}(\d{2})?$/,
        normalize: (value) => value.replace(/\D/g, '').slice(0, 5),
        inputMode: 'numeric',
        maxLength: 5
    },
    KR: {
        regex: /^\d{5}$/,
        normalize: (value) => value.replace(/\D/g, '').slice(0, 5),
        inputMode: 'numeric',
        maxLength: 5
    },
    PL: {
        regex: /^\d{2}-\d{3}$/,
        normalize: (value) => {
            const postalCode = value.replace(/\D/g, '').slice(0, 5)
            return postalCode.length > 2
                ? `${postalCode.slice(0, 2)}-${postalCode.slice(2)}`
                : postalCode
        },
        inputMode: 'numeric',
        maxLength: 6
    },
    PT: {
        regex: /^\d{4}-\d{3}$/,
        normalize: (value) => {
            const postalCode = value.replace(/\D/g, '').slice(0, 7)
            return postalCode.length > 4
                ? `${postalCode.slice(0, 4)}-${postalCode.slice(4)}`
                : postalCode
        },
        inputMode: 'numeric',
        maxLength: 8
    },
    SE: {
        regex: /^\d{3} \d{2}$/,
        normalize: (value) => {
            const postalCode = value.replace(/\D/g, '').slice(0, 5)
            return postalCode.length > 3
                ? `${postalCode.slice(0, 3)} ${postalCode.slice(3)}`
                : postalCode
        },
        inputMode: 'numeric',
        maxLength: 6
    },
    DK: {
        regex: /^\d{4}$/,
        normalize: (value) => value.replace(/\D/g, '').slice(0, 4),
        inputMode: 'numeric',
        maxLength: 4
    },
    FI: {
        regex: /^\d{5}$/,
        normalize: (value) => value.replace(/\D/g, '').slice(0, 5),
        inputMode: 'numeric',
        maxLength: 5
    },
    NO: {
        regex: /^\d{4}$/,
        normalize: (value) => value.replace(/\D/g, '').slice(0, 4),
        inputMode: 'numeric',
        maxLength: 4
    },
    AU: {
        regex: /^\d{4}$/,
        normalize: (value) => value.replace(/\D/g, '').slice(0, 4),
        inputMode: 'numeric',
        maxLength: 4
    },
    NZ: {
        regex: /^\d{4}$/,
        normalize: (value) => value.replace(/\D/g, '').slice(0, 4),
        inputMode: 'numeric',
        maxLength: 4
    }
}

const fallbackPostalCodeFormat = {
    regex: /^[A-Z0-9][A-Z0-9 -]{1,8}[A-Z0-9]$/,
    normalize: (value) =>
        value
            .replace(/[^A-Za-z0-9 -]/g, '')
            .toUpperCase()
            .slice(0, 10),
    inputMode: 'text',
    maxLength: 10
}

export const getPostalCodeFormat = (countryCode) =>
    postalCodeFormats[countryCode] || fallbackPostalCodeFormat

export const isEligibleShippingOption = (shippingOption) => {
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

const compareByFastestDeliveryWindow = (first, second) => {
    const endDifference = getTime(first.deliveryWindow.endAt) - getTime(second.deliveryWindow.endAt)
    if (endDifference !== 0) return endDifference

    const startDifference =
        getTime(first.deliveryWindow.startAt) - getTime(second.deliveryWindow.startAt)
    if (startDifference !== 0) return startDifference

    return String(first.shippingMethodId || '').localeCompare(String(second.shippingMethodId || ''))
}

/**
 * Returns the fastest eligible shipping option for the requested product.
 * The PDP summary follows Storefront Next by selecting the earliest window end,
 * then the earliest start time as a deterministic tie-breaker.
 */
export const getFastestDeliveryEstimate = (productId, deliveryEstimates) => {
    const productEstimate = deliveryEstimates?.productDeliveryEstimates?.find(
        (estimate) => estimate.productId === productId
    )
    const eligibleOptions = productEstimate?.shippingOptions?.filter(isEligibleShippingOption) || []

    if (!eligibleOptions.length) return null

    return [...eligibleOptions].sort(compareByFastestDeliveryWindow)[0]
}

export const getFallbackDeliveryDescription = (shippingMethods) =>
    shippingMethods
        ?.find(
            (method) =>
                method.id !== PICKUP_SHIPPING_METHOD_ID &&
                method.c_storePickupEnabled !== true &&
                method.description?.trim()
        )
        ?.description?.trim() || null

export const normalizeDestination = (destination) => {
    const {countryCode, postalCode} = destination || {}
    const normalizedCountryCode = countryCode?.trim().toUpperCase() || ''
    return {
        countryCode: normalizedCountryCode,
        postalCode: getPostalCodeFormat(normalizedCountryCode).normalize(postalCode || '')
    }
}

export const isValidDestination = (destination) => {
    const {countryCode, postalCode} = destination || {}
    return (
        /^[A-Z]{2}$/.test(countryCode) &&
        typeof postalCode === 'string' &&
        getPostalCodeFormat(countryCode).regex.test(postalCode)
    )
}

export const getPreferredDeliveryDestination = (addresses, defaultCountryCode) => {
    if (!Array.isArray(addresses)) return null

    const shippingAddresses = addresses.filter((address) =>
        address.addressId?.toLowerCase().includes('shipping')
    )
    const preferredAddress =
        shippingAddresses.find((address) => address.preferred) ||
        shippingAddresses[0] ||
        addresses.find((address) => address.addressId?.toLowerCase().includes('billing')) ||
        addresses.find((address) => address.preferred) ||
        addresses[0]
    const destination = normalizeDestination({
        countryCode: preferredAddress?.countryCode || defaultCountryCode,
        postalCode: preferredAddress?.postalCode
    })

    return isValidDestination(destination) ? destination : null
}
