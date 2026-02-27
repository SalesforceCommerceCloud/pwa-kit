/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Shopper Configurations feature flag for marketing consent
export const ENABLE_CONSENT_WITH_MARKETING_CLOUD = 'EnableConsentWithMarketingCloud'

// Marketing consent status constants
export const CONSENT_STATUS = {
    OPT_IN: 'opt_in',
    OPT_OUT: 'opt_out'
}

// Marketing consent channels, as configured by an administrator.
export const CONSENT_CHANNELS = {
    EMAIL: 'email',
    SMS: 'sms'
}

// Marketing consent tags, as configured by an administrator.
// These tags allow you to organize subscriptions by where they appear in the UI
export const CONSENT_TAGS = {
    ACCOUNT: 'account',
    CHECKOUT: 'checkout',
    REGISTRATION: 'registration',
    EMAIL_CAPTURE: 'email_capture'
}
