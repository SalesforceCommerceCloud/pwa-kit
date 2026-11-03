/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable no-relative-import-paths/no-relative-import-paths -- Server modules run directly under Node. */
import {createApiKeyAuth, apiKeyRequestProfile} from './api-key'
import {createEcaAuth, ecaRequestProfile} from './eca'
import {createBmEcaAuth} from './bm-eca'

export function gatewayAuthMode(env) {
    const mode = env.LLM_GATEWAY_AUTH_MODE || 'api_key'
    if (!['api_key', 'eca', 'eca_direct'].includes(mode))
        throw new Error('LLM_GATEWAY_AUTH_MODE must be api_key, eca or eca_direct')
    return mode
}
export const createGatewayAuth = (options) => {
    switch (gatewayAuthMode(options.env)) {
        case 'eca':
            return createBmEcaAuth(options)
        case 'eca_direct':
            return createEcaAuth(options)
        default:
            return createApiKeyAuth(options.env)
    }
}

export const createGatewayProfile = (env) =>
    gatewayAuthMode(env) === 'api_key' ? apiKeyRequestProfile(env) : ecaRequestProfile(env)
