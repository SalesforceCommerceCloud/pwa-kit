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
export const DWSID_STORAGE_KEY = 'dwsid'
export const ECOM_ACCESS_TOKEN_STORAGE_KEY = 'cc-at'
export const DWSID_SERVER_AFFINITY_HEADER = 'sfdc_dwsid'

// commerce-sdk-react namespaces cookies with siteID as suffixes to allow multisite setups.
// However some cookies are set and used outside of PWA Kit and must not be modified with suffixes.
export const EXCLUDE_COOKIE_SUFFIX = ['dwsid']