/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {X_SITE_ID, DWSID_COOKIE_NAME} from './constants'

/**
 * `slasKey` (optional): the SLAS response field name this cookie shadows.
 * `getResponseBodyFieldsToStrip()` reads these to know which JSON fields to
 * delete from the response body before forwarding to the client, keeping the
 * "what is HttpOnly" definition in one place.
 */
export const SESSION_COOKIE_CONFIG = {
    accessToken: {
        key: 'cc-at',
        attributes: {httpOnly: true, secure: true, sameSite: 'lax', path: '/'},
        slasKey: 'access_token'
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
        attributes: {httpOnly: true, secure: true, sameSite: 'lax', path: '/'},
        slasKey: 'idp_access_token'
    },
    refreshTokenGuest: {
        key: 'cc-nx-g',
        attributes: {httpOnly: true, secure: true, sameSite: 'lax', path: '/'},
        slasKey: 'refresh_token'
    },
    refreshTokenRegistered: {
        key: 'cc-nx',
        attributes: {httpOnly: true, secure: true, sameSite: 'lax', path: '/'},
        slasKey: 'refresh_token'
    },
    customerId: {
        key: 'customer_id',
        attributes: {httpOnly: false, secure: true, sameSite: 'lax', path: '/'}
    },
    encUserId: {
        key: 'enc_user_id',
        attributes: {httpOnly: false, secure: true, sameSite: 'lax', path: '/'}
    },
    customerType: {
        key: 'customer_type',
        attributes: {httpOnly: false, secure: true, sameSite: 'lax', path: '/'}
    },
    usid: {
        key: 'usid',
        attributes: {httpOnly: false, secure: true, sameSite: 'lax', path: '/'}
    },
    // Absolute epoch (seconds) when the refresh token expires. Mirrors the
    // shape of `cc-at-expires` (which carries the access token expiry) so SFRA
    // can read it without parsing or doing arithmetic.
    refreshTokenExpires: {
        key: 'cc-nx-expires',
        attributes: {httpOnly: false, secure: true, sameSite: 'lax', path: '/'}
    },
    idToken: {
        key: 'id_token',
        attributes: {httpOnly: false, secure: true, sameSite: 'lax', path: '/'}
    },
    idpRefreshToken: {
        key: 'idp_refresh_token',
        attributes: {httpOnly: true, secure: true, sameSite: 'lax', path: '/'},
        slasKey: 'idp_refresh_token'
    }
}

export const getSiteId = (request) => request.headers?.[X_SITE_ID]

export const getCookieName = (config, siteId) => `${config.key}_${siteId}`

export const getAllCookieConfigs = () => Object.values(SESSION_COOKIE_CONFIG)

export const getCookieNamesToStripFromProxy = (siteId) => [
    getCookieName(SESSION_COOKIE_CONFIG.accessToken, siteId),
    getCookieName(SESSION_COOKIE_CONFIG.refreshTokenGuest, siteId),
    getCookieName(SESSION_COOKIE_CONFIG.refreshTokenRegistered, siteId),
    getCookieName(SESSION_COOKIE_CONFIG.idpRefreshToken, siteId),
    DWSID_COOKIE_NAME
]

/**
 * Returns the unique SLAS response body fields that correspond to HttpOnly
 * cookies. These fields are deleted from the JSON body before the response
 * is forwarded to the client, so the tokens are only readable via cookies.
 */
export const getResponseBodyFieldsToStrip = () => [
    ...new Set(
        Object.values(SESSION_COOKIE_CONFIG)
            .map((c) => c.slasKey)
            .filter(Boolean)
    )
]
