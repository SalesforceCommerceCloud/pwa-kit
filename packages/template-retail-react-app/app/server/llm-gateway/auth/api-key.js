/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Development API-key authentication is isolated from the transport and storefront code.
export function createApiKeyAuth(env) {
    if (!env.LLM_GATEWAY_API_KEY || !env.LLM_GATEWAY_SFDC_CORE_TENANT_ID)
        throw new Error('Set LLM_GATEWAY_API_KEY and LLM_GATEWAY_SFDC_CORE_TENANT_ID')
    return {
        refreshable: false,
        async authorize() {
            return {
                headers: {
                    Authorization: `API_KEY ${env.LLM_GATEWAY_API_KEY}`,
                    'x-sfdc-core-tenant-id': env.LLM_GATEWAY_SFDC_CORE_TENANT_ID
                },
                invalidate: () => undefined
            }
        }
    }
}

// Keep the development endpoint and payload contract with its authentication adapter.
export function apiKeyRequestProfile(env) {
    let base
    try {
        base = new URL(env.LLM_GATEWAY_URL)
    } catch {
        throw new Error('Invalid Gateway configuration')
    }
    const version = env.LLM_GATEWAY_API_VERSION || 'v1.0'
    if (
        base.protocol !== 'https:' ||
        !['.sfdc.cl', '.salesforce.com'].some((suffix) => base.hostname.endsWith(suffix)) ||
        base.username ||
        base.password ||
        base.search ||
        base.hash ||
        (base.port && base.port !== '443') ||
        !/^v\d+\.\d+$/.test(version)
    )
        throw new Error('Invalid Gateway configuration')
    return {
        endpoint: new URL(`${base.href.replace(/\/$/, '')}/${version}/chat/generations/stream`),
        featureId: env.LLM_GATEWAY_CLIENT_FEATURE || 'plannerservice',
        body: (messages, stream, maxTokens) => ({
            model: env.LLM_GATEWAY_MODEL || 'llmgateway__VertexAIGemini20Flash001',
            messages,
            generation_settings: {
                num_generations: 1,
                max_tokens: maxTokens,
                temperature: stream ? 0.3 : 0,
                frequency_penalty: 0.0,
                presence_penalty: 0.0
            },
            system_prompt_strategy: 'use_model_parameter'
        })
    }
}
