/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'

import {createRemoteJWKSet as joseCreateRemoteJWKSet, jwtVerify, decodeJwt} from 'jose'

const CLAIM = {
    ISSUER: 'iss'
}

const DELIMITER = {
    ISSUER: '/'
}

/**
 * Throws a standardized error for SLAS token validation failures.
 *
 * @param {string} message - The error message describing the validation failure.
 * @param {number} code - The HTTP status code associated with the error.
 * @throws {Error} Always throws an error with the provided message and code.
 */
const throwSlasTokenValidationError = (message, code) => {
    throw new Error(`SLAS Token Validation Error: ${message}`, code)
}

/**
 * Creates a remote JSON Web Key Set (JWKS) URL for verifying JWTs.
 *
 * @param {string} tenantId - The tenant ID for the authentication request.
 * @param {string} shortCode - The short code for the Salesforce instance.
 * @returns {Function} A function that fetches and caches JWKS for JWT verification.
 */
export const createRemoteJWKSet = (tenantId, shortCode) => {
    const appOrigin = getAppOrigin()
    const JWKS_URI = `${appOrigin}/${shortCode}/${tenantId}/oauth2/jwks`

    return joseCreateRemoteJWKSet(new URL(JWKS_URI))
}

/**
 * Validates a SLAS (Salesforce Login and Authentication Service) callback token.
 *
 * @param {string} token - The JWT token to be validated.
 * @param {string} shortCode - The short code for the Salesforce instance.
 * @param {string} tenantId - The expected tenant ID for validation.
 * @returns {Promise<Object>} Resolves with the decoded JWT payload if valid.
 * @throws {Error} If the tenant ID does not match or the token is invalid.
 */
export const validateSlasCallbackToken = async (token, shortCode, tenantId) => {
    const payload = decodeJwt(token)
    const subClaim = payload[CLAIM.ISSUER]
    const tokens = subClaim.split(DELIMITER.ISSUER)
    const parsedTenantId = tokens[2]

    // If a configuration object is provided, validate the tenant ID against the configured tenant ID.
    if (parsedTenantId !== tenantId) {
        throw new Error(
            `The tenant ID in your PWA Kit configuration ("${tenantId}") does not match the tenant ID in the SLAS callback token ("${tenantId}").`
        )
    }

    try {
        const jwks = createRemoteJWKSet(tenantId, shortCode)
        const {payload} = await jwtVerify(token, jwks, {})
        return payload
    } catch (error) {
        throwSlasTokenValidationError(error.message, 401)
    }
}
