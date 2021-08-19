/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {nanoid} from 'nanoid'
import {encode as base64encode} from 'base64-arraybuffer'

// Creates Code Verifier
export const createCodeVerifier = () => nanoid(128)

// Creates Code Challenge based on Code Verifier
export const generateCodeChallenge = async (codeVerifier) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    const digest = await window.crypto.subtle.digest('SHA-256', data)
    const base64Digest = base64encode(digest)
    // you can extract this replacing code to a function
    return base64Digest
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}
