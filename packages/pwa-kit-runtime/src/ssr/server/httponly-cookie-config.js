/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {X_SITE_ID, DWSID_COOKIE_NAME} from './constants'

export const SESSION_COOKIE_CONFIG = {
    accessToken: {
        key: 'cc-at',
        attributes: {httpOnly: true, secure: true, sameSite: 'lax', path: '/'}
    },
    accessTokenExpires: {
        key: 'cc-at-expires',
        attributes: {httpOnly: false, secure: true, sameSite: 'lax', path: '/'}
    },
    accessTokenDnt: {
        key: 'cc-at-dnt',
        attributes: {httpOnly: false, secure: true, sameSite: 'lax', path: '/'}
    },
    uido: {key: 'uido', attributes: {httpOnly: false, secure: true, sameSite: 'lax', path: '/'}},
    idpAccessToken: {
        key: 'idp_access_token',
        attributes: {httpOnly: true, secure: true, sameSite: 'lax', path: '/'}
    },
    refreshTokenGuest: {
        key: 'cc-nx-g',
        attributes: {httpOnly: true, secure: true, sameSite: 'lax', path: '/'}
    },
    refreshTokenRegistered: {
        key: 'cc-nx',
        attributes: {httpOnly: true, secure: true, sameSite: 'lax', path: '/'}
    },
    refreshTokenExists: {
        key: 'cc-nx-exists',
        attributes: {httpOnly: false, secure: true, sameSite: 'lax', path: '/'}
    }
}

export const getSiteId = (request) => request.headers?.[X_SITE_ID]

export const getCookieName = (config, siteId) => `${config.key}_${siteId}`

export const getAllCookieConfigs = () => Object.values(SESSION_COOKIE_CONFIG)

export const getCookieNamesToStripFromProxy = (siteId) => [
    getCookieName(SESSION_COOKIE_CONFIG.accessToken, siteId),
    getCookieName(SESSION_COOKIE_CONFIG.refreshTokenGuest, siteId),
    getCookieName(SESSION_COOKIE_CONFIG.refreshTokenRegistered, siteId),
    DWSID_COOKIE_NAME
]
