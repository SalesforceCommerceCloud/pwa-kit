/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const PAYMENT_METHODS = {
    ADYEN_COMPONENT: 'AdyenComponent',
    CREDIT_CARD: 'CREDIT_CARD'
}

export const PAYMENT_METHOD_TYPES = {
    GIFT_CARD: 'giftcard',
    WECHATPAY_MINI_PROGRAM: 'wechatpayMiniProgram',
    WECHATPAY_QR: 'wechatpayQR',
    WECHATPAY_SDK: 'wechatpaySDK'
}

export const RESULT_CODES = {
    AUTHORISED: 'Authorised',
    CANCELLED: 'Cancelled',
    CHALLENGESHOPPER: 'ChallengeShopper',
    ERROR: 'Error',
    IDENTIFYSHOPPER: 'IdentifyShopper',
    PENDING: 'Pending',
    PRESENTTOSHOPPER: 'PresentToShopper',
    RECEIVED: 'Received',
    REDIRECTSHOPPER: 'RedirectShopper',
    REFUSED: 'Refused'
}

export const BLOCKED_PAYMENT_METHODS = [
    PAYMENT_METHOD_TYPES.GIFT_CARD,
    PAYMENT_METHOD_TYPES.WECHATPAY_MINI_PROGRAM,
    PAYMENT_METHOD_TYPES.WECHATPAY_QR,
    PAYMENT_METHOD_TYPES.WECHATPAY_SDK
]

export const SHOPPER_INTERACTIONS = {
    CONT_AUTH: 'ContAuth',
    ECOMMERCE: 'Ecommerce'
}

export const RECURRING_PROCESSING_MODEL = {
    CARD_ON_FILE: 'CardOnFile'
}

export const ORDER = Object.freeze({
    ORDER_STATUS_CREATED: 'created',
    ORDER_STATUS_NEW: 'new',
    ORDER_STATUS_COMPLETED: 'completed',
    ORDER_STATUS_CANCELED: 'cancelled',
    ORDER_STATUS_FAILED: 'failed',
    PAYMENT_STATUS_PAID: 'paid',
    PAYMENT_STATUS_PART_PAID: 'part_paid',
    PAYMENT_STATUS_NOT_PAID: 'not_paid',
    EXPORT_STATUS_READY: 'ready',
    EXPORT_STATUS_FAILED: 'failed',
    EXPORT_STATUS_EXPORTED: 'exported',
    EXPORT_STATUS_NOT_EXPORTED: 'not_exported',
    CONFIRMATION_STATUS_CONFIRMED: 'confirmed',
    CONFIRMATION_STATUS_NOT_CONFIRMED: 'not_confirmed'
})

export const ADYEN_LIVE_REGIONS = {
    LIVE_EU: 'live',
    LIVE_APSE: 'live-apse',
    LIVE_AU: 'live-au',
    LIVE_US: 'live-us',
    LIVE_IN: 'live-in'
}

export const ADYEN_ENVIRONMENT = {
    LIVE: 'LIVE',
    TEST: 'TEST'
}

export const APPLICATION_VERSION = '3.0.0'

export const ADYEN_API_BASEPATH = 'https://api-test.adyen.com/v70'

// Mock constants for testing
export const CUSTOMER_ID_MOCK = 'mock-customer-id'
export const LOCALE_MOCK = 'en-US'
