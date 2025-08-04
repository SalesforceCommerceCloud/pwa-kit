/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Payment method types
export const PAYMENT_METHODS = {
    APPLE_PAY: 'applepay',
    GOOGLE_PAY: 'googlepay'
}

// Express payment message types
export const EXPRESS_MESSAGES = {
    //PAYMENT_AVAILABLE: 'express.payment.available',
    PAYMENT_DONE: 'express.payment.done', // TODO: rename to something that makes more sense -- back to available probably?
    PAYMENT_UNAVAILABLE: 'express.payment.unavailable',
    PAYMENT_SUCCESS: 'express.payment.success',
    PAYMENT_FAILURE: 'express.payment.failure',
    PAYMENT_CANCEL: 'express.payment.cancel'
}

// Express button constants
export const EXPRESS_BUTTON_HEIGHT = 40
export const EXPRESS_BUTTON_GAP = 8
