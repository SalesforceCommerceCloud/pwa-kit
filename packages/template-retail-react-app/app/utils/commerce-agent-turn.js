/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const TURN_ID = /^turn_[A-Za-z0-9_-]{1,96}$/

export async function readOverview(response, turnId, onDelta) {
    if (
        !response.ok ||
        !response.headers.get('content-type')?.includes('text/event-stream') ||
        !response.body
    )
        throw new Error('Invalid overview stream')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let pending = ''
    try {
        for (;;) {
            const {done, value} = await reader.read()
            if (done) throw new Error('Overview stream ended early')
            pending += decoder.decode(value, {stream: true})
            pending = pending.replace(/\r\n/g, '\n')
            let end
            while ((end = pending.indexOf('\n\n')) !== -1) {
                const frame = pending.slice(0, end)
                pending = pending.slice(end + 2)
                const lines = frame.split('\n')
                const event = lines
                    .find((line) => line.startsWith('event:'))
                    ?.slice(6)
                    .trim()
                const data = lines
                    .filter((line) => line.startsWith('data:'))
                    .map((line) => line.slice(5).trimStart())
                    .join('\n')
                if (!event || !data) continue
                const item = JSON.parse(data)
                if (item.turnId !== turnId) continue
                if (event === 'completed') return
                if (event === 'error') throw new Error('Overview failed')
                if (
                    event === 'content_delta' &&
                    item.content?.type === 'ai_overview' &&
                    typeof item.content.delta === 'string'
                )
                    onDelta(item.content.delta)
            }
        }
    } finally {
        await reader.cancel().catch(() => {})
        reader.releaseLock()
    }
}
