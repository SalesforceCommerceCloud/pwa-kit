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

export const SLAS_SECRET_WARNING_MSG =
    'You are potentially exposing SLAS secret on browser. Make sure to keep it safe and secure!'

export const SLAS_SECRET_PLACEHOLDER = '_PLACEHOLDER_PROXY-PWA_KIT_SLAS_CLIENT_SECRET'
