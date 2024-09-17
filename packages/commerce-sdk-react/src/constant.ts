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

// commerce-sdk-react namespaces cookies with siteID as suffixes to allow multisite setups.
// However some cookies are set and used outside of PWA Kit and must not be modified with suffixes.
export const EXCLUDE_COOKIE_SUFFIX = ['dwsid']
