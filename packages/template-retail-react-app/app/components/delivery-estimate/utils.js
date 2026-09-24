/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getCountryCodeFromLocale} from '@salesforce/retail-react-app/app/components/delivery-estimate/locale'

export {getCountryCodeFromLocale}

const getTime = (value) => {
    if (value == null) return null

    const time = new Date(value).getTime()
    return Number.isFinite(time) ? time : null
}

const PICKUP_SHIPPING_METHOD_ID = '005'
const DELIVERY_DESTINATION_POSTAL_CODE_RE = /^[A-Z0-9](?:[A-Z0-9 -]{0,10}[A-Z0-9])?$/i

const ISO_COUNTRY_CODES = new Set(
    'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(
        ' '
    )
)

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
        example: '90210',
        termKey: 'zip',
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
        example: 'M5V 3A8',
        termKey: 'postalCode',
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
        example: 'SW1A 1AA',
        termKey: 'postcode',
        normalize: normalizeGB,
        inputMode: 'text',
        maxLength: 8
    },
    IE: {
        regex: /^[A-Z]\d{2} [A-Z\d]{4}$/,
        example: 'D02 X285',
        termKey: 'eircode',
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
        example: '00100',
        termKey: 'cap',
        normalize: (value) => value.replace(/\D/g, '').slice(0, 5),
        inputMode: 'numeric',
        maxLength: 5
    },
    DE: {
        regex: /^\d{5}$/,
        example: '10115',
        termKey: 'postalCode',
        normalize: (value) => value.replace(/\D/g, '').slice(0, 5),
        inputMode: 'numeric',
        maxLength: 5
    },
    FR: {
        regex: /^\d{5}$/,
        example: '75001',
        termKey: 'postalCode',
        normalize: (value) => value.replace(/\D/g, '').slice(0, 5),
        inputMode: 'numeric',
        maxLength: 5
    },
    ES: {
        regex: /^\d{5}$/,
        example: '28001',
        termKey: 'postalCode',
        normalize: (value) => value.replace(/\D/g, '').slice(0, 5),
        inputMode: 'numeric',
        maxLength: 5
    },
    NL: {
        regex: /^\d{4} [A-Z]{2}$/,
        example: '1011 AA',
        termKey: 'postalCode',
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
        example: '100-0001',
        termKey: 'postalCode',
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
        example: '100000',
        termKey: 'postalCode',
        normalize: (value) => value.replace(/\D/g, '').slice(0, 6),
        inputMode: 'numeric',
        maxLength: 6
    },
    TW: {
        regex: /^\d{3}(\d{2})?$/,
        example: '100',
        termKey: 'postalCode',
        normalize: (value) => value.replace(/\D/g, '').slice(0, 5),
        inputMode: 'numeric',
        maxLength: 5
    },
    KR: {
        regex: /^\d{5}$/,
        example: '04524',
        termKey: 'postalCode',
        normalize: (value) => value.replace(/\D/g, '').slice(0, 5),
        inputMode: 'numeric',
        maxLength: 5
    },
    PL: {
        regex: /^\d{2}-\d{3}$/,
        example: '00-001',
        termKey: 'postalCode',
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
        example: '1000-001',
        termKey: 'postalCode',
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
        example: '111 22',
        termKey: 'postalCode',
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
        example: '1050',
        termKey: 'postalCode',
        normalize: (value) => value.replace(/\D/g, '').slice(0, 4),
        inputMode: 'numeric',
        maxLength: 4
    },
    FI: {
        regex: /^\d{5}$/,
        example: '00100',
        termKey: 'postalCode',
        normalize: (value) => value.replace(/\D/g, '').slice(0, 5),
        inputMode: 'numeric',
        maxLength: 5
    },
    NO: {
        regex: /^\d{4}$/,
        example: '0150',
        termKey: 'postalCode',
        normalize: (value) => value.replace(/\D/g, '').slice(0, 4),
        inputMode: 'numeric',
        maxLength: 4
    },
    AU: {
        regex: /^\d{4}$/,
        example: '2000',
        termKey: 'postcode',
        normalize: (value) => value.replace(/\D/g, '').slice(0, 4),
        inputMode: 'numeric',
        maxLength: 4
    },
    NZ: {
        regex: /^\d{4}$/,
        example: '6011',
        termKey: 'postcode',
        normalize: (value) => value.replace(/\D/g, '').slice(0, 4),
        inputMode: 'numeric',
        maxLength: 4
    }
}

const fallbackPostalCodeFormat = {
    regex: /^[A-Z0-9][A-Z0-9 -]{1,8}[A-Z0-9]$/,
    example: '',
    termKey: 'postalCode',
    normalize: (value) =>
        value
            .replace(/[^A-Za-z0-9 -]/g, '')
            .toUpperCase()
            .slice(0, 10),
    inputMode: 'text',
    maxLength: 10
}

export const normalizeCountryCode = (value) => {
    if (typeof value !== 'string') return undefined
    const countryCode = value.trim().toUpperCase()
    return ISO_COUNTRY_CODES.has(countryCode) ? countryCode : undefined
}

export const getPostalCodeFormat = (countryOrLocale) => {
    const countryCode =
        normalizeCountryCode(countryOrLocale) || getCountryCodeFromLocale(countryOrLocale)
    return countryCode
        ? postalCodeFormats[countryCode] || fallbackPostalCodeFormat
        : fallbackPostalCodeFormat
}

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
    const normalizedCountryCode = normalizeCountryCode(countryCode) || ''
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

export const getSavedDeliveryDestination = (siteId, defaultCountryCode) => {
    if (!siteId || typeof document === 'undefined') return null

    const cookieName = `deliveryZipCode_${siteId}`
    const escapedCookieName = cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${escapedCookieName}=([^;]+)`))
    if (!match) return null

    try {
        const value = decodeURIComponent(match[1])
        const legacyPostalCode = value.trim()
        const savedDestination = DELIVERY_DESTINATION_POSTAL_CODE_RE.test(legacyPostalCode)
            ? {postalCode: legacyPostalCode}
            : JSON.parse(value)
        const destination = normalizeDestination({
            countryCode: savedDestination.countryCode || defaultCountryCode || '',
            postalCode: savedDestination.postalCode
        })

        return isValidDestination(destination) ? destination : null
    } catch {
        return null
    }
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
