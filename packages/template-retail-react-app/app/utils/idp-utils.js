/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {nanoid} from 'nanoid'
import {encode as base64encode} from 'base64-arraybuffer'

/**
 * Creates Code Verifier use for PKCE auth flow.
 *
 * Note: This function is part of the SDK, but not exposed.
 *
 * @returns {String} The 128 character length code verifier.
 */
export const createCodeVerifier = () => nanoid(128)

/**
 * Creates Code Challenge based on Code Verifier. T
 *
 * Note: This function is part of the SDK, but not exposed.
 *
 * @param {String} codeVerifier
 * @returns {String} The generated code challenge
 * @throws {Error} If there's an error during the generation of the code challenge
 */
export const generateCodeChallenge = async (codeVerifier) => {
    if (!codeVerifier) throw new Error('No code verifier provided')

    try {
        const encoder = new TextEncoder()
        const data = encoder.encode(codeVerifier)
        const digest = await window.crypto.subtle.digest('SHA-256', data)

        const base64Digest = base64encode(digest)

        return base64Digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    } catch (error) {
        throw new Error(`Failed to generate code challenge: ${error.message}`)
    }
}

/**
 * Redirect the current window to the Auth URL configured in SLAS
 *
 * @param {String} proxy
 * @param {String} idp
 * @param {String} codeChallenge
 * @param {String} slasCallbackEndpoint
 * @param {String} clientId
 * @param {String} siteId
 * @param {String} organizationId
 */
export const redirectToAuthURL = (
    proxy,
    idp,
    codeChallenge,
    redirect_uri,
    clientId,
    siteId,
    tenantId
) => {
    const params = new URLSearchParams({
        redirect_uri: redirect_uri,
        client_id: clientId,
        code_challenge: codeChallenge,
        response_type: 'code',
        channel_id: siteId,
        hint: idp
    })

    console.log('redirect uri: ', redirect_uri)

    const url = `${proxy}/shopper/auth/v1/organizations/${tenantId}/oauth2/authorize?${params.toString()}`
    console.log('THIS IS THE URL: ', url)

    window.location.assign(url)
}