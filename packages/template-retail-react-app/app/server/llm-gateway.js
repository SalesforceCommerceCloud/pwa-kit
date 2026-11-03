/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths -- Server module, excluded from browser bundles.
import {createGatewayAuth, createGatewayProfile} from './llm-gateway/auth'

const SKIP_EVENTS = new Set(['scoringStarted', 'scores', 'scoringCompleted'])
const MAX_FRAME = 128 * 1024

// Split only SSE line endings, never Unicode paragraph/line separators inside JSON.
export async function* readGatewayEvents(body) {
    const decoder = new TextDecoder()
    let buffer = ''
    let event = ''
    let data = []
    for await (const bytes of body) {
        buffer += decoder.decode(bytes, {stream: true})
        if (buffer.length > MAX_FRAME) throw new Error('Stream frame too large')
        let match
        while ((match = /\r\n|\r|\n/.exec(buffer))) {
            if (match[0] === '\r' && match.index === buffer.length - 1) break
            const line = buffer.slice(0, match.index)
            buffer = buffer.slice(match.index + match[0].length)
            if (!line) {
                if (data.length) yield {event, data: data.join('\n')}
                event = ''
                data = []
            } else if (line.startsWith('event:')) {
                event = line.slice(6).trim()
            } else if (line.startsWith('data:')) {
                data.push(line.slice(5).replace(/^ /, ''))
                if (data.join('\n').length > MAX_FRAME) throw new Error('Stream frame too large')
            }
        }
    }
}

// This configured endpoint is server-only; requests cannot select a Gateway destination.
export const buildGatewayUrl = (env) => createGatewayProfile(env).endpoint

export function createGatewayClient({env, fetchImpl = fetch}) {
    const profile = createGatewayProfile(env)
    const auth = createGatewayAuth({env, fetchImpl})
    const open = async (messages, signal, stream, maxTokens) => {
        const url = new URL(profile.endpoint)
        if (!stream) url.pathname = url.pathname.replace(/\/stream$/, '')
        let response
        for (let attempt = 0; attempt < 2; attempt++) {
            const authorization = await auth.authorize()
            if (signal?.aborted) throw new Error('Gateway request cancelled')
            response = await fetchImpl(url, {
                method: 'POST',
                redirect: 'error',
                signal,
                headers: {
                    ...authorization.headers,
                    'Content-Type': 'application/json',
                    Accept: stream ? 'text/event-stream' : 'application/json',
                    'x-sfdc-app-context': env.LLM_GATEWAY_APP_CONTEXT || 'EinsteinGPT',
                    'x-client-feature-id': profile.featureId
                },
                body: JSON.stringify(profile.body(messages, stream, maxTokens))
            })
            if (response.status !== 401 || !auth.refreshable || attempt > 0) break
            await response.body?.cancel?.().catch(() => {})
            authorization.invalidate()
        }
        if (
            !response.ok ||
            (stream && !response.headers.get('content-type')?.includes('text/event-stream'))
        ) {
            const error = new Error('Gateway request failed')
            error.status = response.status
            await response.body?.cancel?.().catch(() => {})
            throw error
        }
        return response
    }
    return {
        async complete(messages, signal) {
            const response = await open(messages, signal, false, 1024)
            const payload = await response.json()
            const content = payload.data || payload
            const text =
                (content.generation_details || content.generationDetails)?.generations?.[0]
                    ?.content || content.choices?.[0]?.message?.content
            if (typeof text !== 'string') throw new Error('Invalid Gateway response')
            return text
        },
        async *stream(messages, signal, maxTokens = 384) {
            const response = await open(messages, signal, true, maxTokens)
            let done = false
            let chars = 0
            try {
                for await (const frame of readGatewayEvents(response.body)) {
                    if (frame.data === '[DONE]') {
                        done = true
                        break
                    }
                    if (frame.event === 'error') throw new Error('Gateway stream failed')
                    if (SKIP_EVENTS.has(frame.event)) continue
                    const payload = JSON.parse(frame.data)
                    const content = payload.data || payload
                    const text =
                        (content.generation_details || content.generationDetails)?.generations?.[0]
                            ?.content || content.choices?.[0]?.delta?.content
                    if (typeof text !== 'string' || !text) continue
                    chars += text.length
                    if (chars > 16000) throw new Error('Summary limit reached')
                    yield text
                }
                if (!done || !chars) throw new Error('Incomplete Gateway stream')
            } finally {
                await response.body?.cancel?.().catch(() => {})
            }
        }
    }
}
