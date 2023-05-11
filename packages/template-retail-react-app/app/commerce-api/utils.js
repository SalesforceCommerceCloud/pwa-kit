/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import jwtDecode from 'jwt-decode'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {HTTPError} from 'pwa-kit-react-sdk/ssr/universal/errors'
import {refreshTokenGuestStorageKey, refreshTokenRegisteredStorageKey} from './constants'
import fetch from 'cross-fetch'

/**
 * Compares the token age against the issued and expiry times. If the token's age is
 * within 60 seconds of its valid time (or exceeds it), we consider the token invalid.
 * @function
 * @param {string} token - The JWT bearer token to be inspected
 * @returns {boolean}
 */
export function isTokenExpired(token) {
    if (!token) {
        return true
    }
    const {exp, iat} = jwtDecode(token.replace('Bearer ', ''))
    const validTimeSeconds = exp - iat - 60
    const tokenAgeSeconds = Date.now() / 1000 - iat
    if (validTimeSeconds > tokenAgeSeconds) {
        return false
    }

    return true
}

// Returns fomrulated body for SopperLogin getToken endpoint
export function createGetTokenBody(urlString, slasCallbackEndpoint, codeVerifier) {
    const url = new URL(urlString)
    const urlParams = new URLSearchParams(url.search)
    const usid = urlParams.get('usid')
    const code = urlParams.get('code')
    return {
        grantType: 'authorization_code_pkce',
        code,
        usid,
        codeVerifier: codeVerifier,
        redirectUri: slasCallbackEndpoint
    }
}

// Ocapi related utilities

const toCamel = (str) => {
    if (str.startsWith('_') || str.startsWith('c_')) {
        return str
    }
    return str.replace(/([-_][a-z])/gi, ($1) => {
        return $1.toUpperCase().replace('-', '').replace('_', '')
    })
}

const isObject = (obj) => {
    return obj === Object(obj) && !Array.isArray(obj) && typeof obj !== 'function'
}

export const keysToCamel = (obj) => {
    if (isObject(obj)) {
        const n = {}

        Object.keys(obj).forEach((k) => {
            n[toCamel(k)] = keysToCamel(obj[k])
        })

        return n
    } else if (Array.isArray(obj)) {
        return obj.map((i) => {
            return keysToCamel(i)
        })
    }

    return obj
}

export const camelCaseKeysToUnderscore = (_obj) => {
    if (typeof _obj != 'object') return _obj

    // Copy the incoming object so we dont mutate it
    let obj
    if (Array.isArray(_obj)) {
        obj = [..._obj]
    } else {
        obj = {..._obj}
    }

    for (var oldName in obj) {
        // Camel to underscore

        let newName = oldName.replace(/([A-Z])/g, ($1) => {
            return '_' + $1.toLowerCase()
        })

        // Only process if names are different
        if (newName != oldName) {
            // Check for the old property name to avoid a ReferenceError in strict mode.
            if (Object.prototype.hasOwnProperty.call(obj, oldName)) {
                obj[newName] = obj[oldName]
                delete obj[oldName]
            }
        }

        // Recursion
        if (typeof obj[newName] == 'object') {
            obj[newName] = camelCaseKeysToUnderscore(obj[newName])
        }
    }

    return obj
}

// This function coverts errors/faults returned from the OCAPI API to the format that is returned from the CAPI
// I added the fault key to make life easier as it's hard to discern a CAPI error
export const convertOcapiFaultToCapiError = (error) => {
    return {
        title: error.message,
        type: error.type,
        detail: error.message,
        // Unique to OCAPI I think
        arguments: error.arguments,
        fault: true
    }
}

// This function checks required parameters and or body for requests to OCAPI endpoints before sending
export const checkRequiredParameters = (listOfPassedParameters, listOfRequiredParameters) => {
    const isBodyOnlyRequiredParam =
        listOfRequiredParameters.includes('body') && listOfRequiredParameters.length === 1

    if (!listOfPassedParameters.parameters && !isBodyOnlyRequiredParam) {
        return {
            title: `Parameters are required for this request`,
            type: `MissingParameters`,
            detail: `Parameters are required for this request`
        }
    }

    if (listOfRequiredParameters.includes('body') && !listOfPassedParameters.body) {
        return {
            title: `Body is required for this request`,
            type: `MissingBody`,
            detail: `Body is  required for this request`
        }
    }

    if (
        isBodyOnlyRequiredParam &&
        listOfRequiredParameters.includes('body') &&
        listOfPassedParameters.body
    ) {
        return undefined
    }

    let undefinedValues = listOfRequiredParameters.filter(
        (req) => !Object.keys(listOfPassedParameters.parameters).includes(req)
    )

    undefinedValues = undefinedValues.filter((value) => value !== 'body')

    if (undefinedValues.length) {
        return {
            title: `The following parameters were missing from your resquest: ${undefinedValues.toString()}`,
            type: `MissingParameters`,
            detail: `The following parameters were missing from your resquest: ${undefinedValues.toString()}`
        }
    } else {
        return undefined
    }
}

// This function is used to interact with the OCAPI API
export const createOcapiFetch =
    (commerceAPIConfig) => async (endpoint, method, args, methodName, body) => {
        const proxy = `/mobify/proxy/ocapi`

        // The api config will only have `ocapiHost` during testing to workaround localhost proxy
        const host = commerceAPIConfig.ocapiHost
            ? `https://${commerceAPIConfig.ocapiHost}`
            : `${getAppOrigin()}${proxy}`

        const siteId = commerceAPIConfig.parameters.siteId
        const headers = {
            ...args[0].headers,
            'Content-Type': 'application/json',
            'x-dw-client-id': commerceAPIConfig.parameters.clientId
        }

        let response
        response = await fetch(`${host}/s/${siteId}/dw/shop/v21_3/${endpoint}`, {
            method: method,
            headers: headers,
            ...(body && {
                body: JSON.stringify(body)
            })
        })
        const httpStatus = response.status

        if (!args[1] && response.json) {
            response = await response.json()
        }

        const convertedResponse = keysToCamel(response)
        if (convertedResponse.fault) {
            const error = convertOcapiFaultToCapiError(convertedResponse.fault)
            throw new HTTPError(httpStatus, error.detail)
        } else {
            return convertedResponse
        }
    }

// This function derrives the SF Tenant Id from the SF OrgId
export const getTenantId = (orgId) => {
    // Derive tenant id id form org id
    const indexToStartOfTenantId = orgId.indexOf('_', orgId.indexOf('_') + 1)
    const tenantId = orgId.substring(indexToStartOfTenantId + 1)
    return tenantId
}

/**
 * Indicates if an JSON response from the SDK should be considered an error
 * @param {object} jsonResponse - The response object returned from SDK calls
 * @returns {boolean}
 */
export const isError = (jsonResponse) => {
    if (!jsonResponse) {
        return false
    }

    const {detail, title, type} = jsonResponse
    if (detail && title && type) {
        return true
    }

    return false
}

/**
 * Decorator that wraps functions to handle error response.
 * @param {function} func - A function which returns a promise
 * @returns {function}
 */
export const handleAsyncError = (func) => {
    return async (...args) => {
        const result = await func(...args)
        if (isError(result)) {
            throw new Error(result.detail)
        }
        return result
    }
}

/**
 * Converts snake-case strings to space separated or sentence case
 * strings by replacing '_' with a ' '.
 * @param {string} text snake-case text.
 * @returns {string} space separated string.
 */
export const convertSnakeCaseToSentenceCase = (text) => {
    return text.split('_').join(' ')
}

/**
 * No operation function. You can use this
 * empty function when you wish to pass
 * around a function that will do nothing.
 * Usually used as default for event handlers.
 */
export const noop = () => {}

/**
 * WARNING: This function is relevant to be used in Hybrid deployments only.
 * Compares the refresh_token keys for guest('cc-nx-g') and registered('cc-nx') login from the cookie received from SFRA with the copy stored in localstorage on PWA Kit
 * to determine if the login state of the shopper on SFRA site has changed. If the keys are different we return true considering the login state did change. If the keys are same,
 * we compare the values of the refresh_token to cover an edge case where the login state might have changed multiple times on SFRA and the eventual refresh_token key might be same
 * as that on PWA Kit which would incorrectly show both keys to be the same even though the sessions are different.
 * @param {Storage} storage Cookie storage on PWA Kit in hybrid deployment.
 * @param {LocalStorage} storageCopy Local storage holding the copy of the refresh_token in hybrid deployment.
 * @returns {boolean} true if the keys do not match (login state changed), false otherwise.
 */
export function hasSFRAAuthStateChanged(storage, storageCopy) {
    let refreshTokenKey =
        (storage.get(refreshTokenGuestStorageKey) && refreshTokenGuestStorageKey) ||
        (storage.get(refreshTokenRegisteredStorageKey) && refreshTokenRegisteredStorageKey)

    let refreshTokenCopyKey =
        (storageCopy.get(refreshTokenGuestStorageKey) && refreshTokenGuestStorageKey) ||
        (storageCopy.get(refreshTokenRegisteredStorageKey) && refreshTokenRegisteredStorageKey)

    if (refreshTokenKey !== refreshTokenCopyKey) {
        return true
    }

    return storage.get(refreshTokenKey) !== storageCopy.get(refreshTokenCopyKey)
}
