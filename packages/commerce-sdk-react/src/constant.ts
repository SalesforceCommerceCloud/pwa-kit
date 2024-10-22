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

export const SLAS_REFRESH_TOKEN_COOKIE_TTL_OVERRIDE_MSG =
    'You are attempting to use an invalid refresh token TTL value.'

export const DNT_COOKIE_NAME = 'dw_dnt' as const

export const DWSID_COOKIE_NAME = 'dwsid'
// commerce-sdk-react namespaces cookies with siteID as suffixes to allow multisite setups.
// However some cookies are set and used outside of PWA Kit and must not be modified with suffixes.
export const EXCLUDE_COOKIE_SUFFIX = [DWSID_COOKIE_NAME, DNT_COOKIE_NAME]

/**
 * For Hybrid Setups only!
 * Unlike SCAPI/OCAPI, ECOM creates baskets in app-server cache initially and move the basket object
 * to the db later based on basket state. In a hybrid storefront, storefront requests might be
 * routed to different appservers, if the basket object is still in appserver cache, you will start
 * seeing inconsistencies in basket state. To avoid this, if you have a dwsid cookie, you must send
 * the value of the dwsid cookie with each SCAPI/OCAPI request in a hybrid storefront to maintain appserver affinity.
 *
 * Use the header key below to send dwsid value with SCAPI/OCAPI requests.
 */
export const SERVER_AFFINITY_HEADER_KEY = 'sfdc_dwsid'
