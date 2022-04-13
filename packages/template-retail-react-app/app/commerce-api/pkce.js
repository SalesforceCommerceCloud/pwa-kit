/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {nanoid} from 'nanoid'
import {encode as base64encode} from 'base64-arraybuffer'

// Server Side
const randomstring = require('randomstring')

// Globals
const isServer = typeof window === 'undefined'

/**
 * Creates Code Verifier use for PKCE auth flow.
 *
 * @returns {String} The 128 character length code verifier.
 */
export const createCodeVerifier = () => {
    return isServer ? randomstring.generate(128) : nanoid(128)
}

/**
 * Creates Code Challenge based on Code Verifier
 *
 * @param {String} codeVerifier
 * @returns {String}
 */
export const generateCodeChallenge = async (codeVerifier) => {
    let base64Digest

    if (isServer) {
        await import('crypto').then((module) => {
            const crypto = module.default
            base64Digest = crypto
                .createHash('sha256')
                .update(codeVerifier)
                .digest('base64')
        })
    } else {
        const encoder = new TextEncoder()
        const data = encoder.encode(codeVerifier)
        const digest = await window.crypto.subtle.digest('SHA-256', data)

        base64Digest = base64encode(digest)
    }

    return base64Digest
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}
