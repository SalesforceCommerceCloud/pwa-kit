/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This list contains domains that can host code in iframe
 */
export const IFRAME_HOST_ALLOW_LIST = Object.freeze([
    'https://runtime.commercecloud.com',
    'https://runtime-admin-staging.mobify-storefront.com',
    'https://runtime-admin-preview.mobify-storefront.com'
])

// We hardcode these here since we don't want commerce-sdk-react to have a dependency on pwa-kit-runtime
export const MOBIFY_PATH = '/mobify'
export const PROXY_PATH = `${MOBIFY_PATH}/proxy`
export const LOCAL_BUNDLE_PATH = `${MOBIFY_PATH}/bundle/development`
export const SLAS_PRIVATE_PROXY_PATH = `${MOBIFY_PATH}/slas/private`

export const SLAS_SECRET_WARNING_MSG =
    'You are potentially exposing SLAS secret on browser. Make sure to keep it safe and secure!'

export const SLAS_SECRET_PLACEHOLDER = '_PLACEHOLDER_PROXY-PWA_KIT_SLAS_CLIENT_SECRET'

export const SLAS_SECRET_OVERRIDE_MSG =
    'You have enabled PWA Kit Private Client mode which gets the SLAS secret from your environment variable. The SLAS secret you have set in the Auth provider will be ignored.'

// In seconds
export const DEFAULT_EXPIRATION_TIME_GUEST_REFRESH_TOKEN = 2592000 // 30 days
export const DEFAULT_EXPIRATION_TIME_REGISTIERED_REFRESH_TOKEN = 7776000 // 90 days

export const EXPIRATION_TIME_EXCEEDS_DEFAULT_WARNING_MSG_GUEST = `The provided expiration time for the guest refresh token exceeds the default value of ${DEFAULT_EXPIRATION_TIME_GUEST_REFRESH_TOKEN} seconds. The default value will be used instead`
export const EXPIRATION_TIME_EXCEEDS_DEFAULT_WARNING_MSG_REGISTERED = `The provided expiration time for the registered user refresh token exceeds the default value of ${DEFAULT_EXPIRATION_TIME_REGISTIERED_REFRESH_TOKEN} seconds. The default value will be used instead`

// Number of seconds in a day: 84600 = (24 hours * 60 minutes * 60 seconds)
// days = seconds/84600
export const SECONDS_TO_DAYS_RATIO = 84600
