/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {createSseParser} from '@salesforce/retail-react-app/app/utils/sse'

export async function readAssistantResponse(response, onEvent) {
    if (!response.ok || !response.headers.get('content-type')?.includes('text/event-stream')) {
        const error = new Error(
            response.status === 404 ? 'context_expired' : 'assistant_unavailable'
        )
        throw error
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    const parser = createSseParser(onEvent)
    try {
        let chunk
        while (!(chunk = await reader.read()).done)
            parser.push(decoder.decode(chunk.value, {stream: true}))
        parser.push(decoder.decode())
    } finally {
        reader.releaseLock()
    }
}
