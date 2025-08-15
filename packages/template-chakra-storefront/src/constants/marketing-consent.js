/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Marketing consent status constants
export const CONSENT_STATUS = SFDC_EXT_MARKETING_CONSENT_ENABLED && {
    OPT_IN: 'opt_in',
    OPT_OUT: 'opt_out'
}

// Marketing consent channels, as configured by an administrator.
export const CONSENT_CHANNELS = SFDC_EXT_MARKETING_CONSENT_ENABLED && {
    EMAIL: 'email',
    SMS: 'sms'
}

// Marketing consent tags, as configured by an administrator.
export const CONSENT_TAGS = SFDC_EXT_MARKETING_CONSENT_ENABLED && {
    HOMEPAGE_BANNER: 'homepage_banner',
    USER_PROFILE: 'user_profile',
    CHECKOUT_PAGE: 'checkout_page',
    REGISTRATION: 'registration'
}
