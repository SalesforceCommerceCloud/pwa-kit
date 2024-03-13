/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {nanoid} from 'nanoid'
import {encode as base64encode} from 'base64-arraybuffer'

import { init } from '@paralleldrive/cuid2'


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
    const length = 228
    const cuid = init({ length });

    let result =isServer ? randomstring.generate(128) : cuid()
    console.log('createCodeVerifier result:', result)
    return result
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
            base64Digest = crypto.createHash('sha256').update(codeVerifier).digest('base64')
        })
    } else {
        const encoder = new TextEncoder()
        console.log('generateCodeChallenge codeVerifier:', codeVerifier)
        const data = encoder.encode(codeVerifier)
        console.log('generateCodeChallenge data:', data)
        const digest = await window.crypto.subtle.digest('SHA-256', data)
        console.log('generateCodeChallenge digest:', digest)

        const hashArray = Array.from(new Uint8Array(digest)); // convert buffer to byte array
        console.log('generateCodeChallenge hashArray:', hashArray)
        const hashHex = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(""); // convert bytes to hex string
        console.log('generateCodeChallenge hashHex:', hashHex)



        base64Digest = base64encode(digest)



    }

    console.log('generateCodeChallenge base64Digest:', base64Digest)
    let result = base64Digest.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    console.log('generateCodeChallenge result:', result)
    return result
}

