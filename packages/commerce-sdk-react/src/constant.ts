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

// We hard code /mobify/proxy here as we don't want commerce-sdk-react to have a dependency on pwa-kit-runtime
export const PROXY_PATH = '/mobify/proxy'

// We hard code /mobify/bundle/development here as we don't want commerce-sdk-react to have a dependency on pwa-kit-runtime
export const LOCAL_BUNDLE_PATH = '/mobify/bundle/development'

// We hard code /mobify/slas/private here as we don't want either of the following:
// * commerce-sdk-react to have a dependency on pwa-kit-runtime
// * /mobify/slas/private to be exposed for configuration via AuthConfig
export const SLAS_PRIVATE_PROXY_PATH = '/mobify/slas/private'

export const SLAS_SECRET_WARNING_MSG =
    'You are potentially exposing SLAS secret on browser. Make sure to keep it safe and secure!'

export const SLAS_SECRET_PLACEHOLDER = '_PLACEHOLDER_PROXY-PWA_KIT_SLAS_CLIENT_SECRET'

export const SLAS_SECRET_OVERRIDE_MSG =
    'You have enabled PWA Kit Private Client mode which gets the SLAS secret from your environment variable. The SLAS secret you have set in the Auth provider will be ignored.'
