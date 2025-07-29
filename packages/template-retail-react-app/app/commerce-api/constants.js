/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const usidStorageKey = 'usid'
export const cidStorageKey = 'cid'
export const encUserIdStorageKey = 'enc-user-id'
export const tokenStorageKey = 'token'
export const refreshTokenRegisteredStorageKey = 'cc-nx'
export const refreshTokenGuestStorageKey = 'cc-nx-g'
export const oidStorageKey = 'oid'
export const dwSessionIdKey = 'dwsid'
export const REFRESH_TOKEN_COOKIE_AGE = 90 // 90 days. This value matches SLAS cartridge.
export const EXPIRED_TOKEN = 'EXPIRED_TOKEN'
export const INVALID_TOKEN = 'invalid refresh_token'

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
export const DWSID_HEADER_KEY = 'sfdc_dwsid'
