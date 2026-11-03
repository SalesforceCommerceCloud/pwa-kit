/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * A minimal, dependency-free parser for the subset of the SSE wire format used by the
 * storefront chat route (`event: <name>\ndata: <one-line JSON>\n\n`, plus `:`-prefixed comment
 * lines). Frames are separated by a blank line and may arrive split across multiple chunks
 * (fetch's `ReadableStream` makes no promise about chunk boundaries lining up with frame
 * boundaries), so this buffers text until it sees a full frame.
 *
 * Usage: feed each decoded text chunk to `push()`; it calls `onEvent(name, data)` for each
 * complete frame as soon as it's seen one. `data` is JSON-parsed when present; comment lines
 * (no `event:`) are ignored. Call `push('')` is a no-op; there's no `end()` — any content left in
 * the buffer after the stream closes without a trailing blank line is intentionally dropped,
 * matching the server, which always ends every frame (including the last) with `\n\n`.
 *
 * @param {(name: string, data: *) => void} onEvent
 * @returns {{push: (chunk: string) => void}}
 */
export const createSseParser = (onEvent) => {
    let buffer = ''

    const handleFrame = (frame) => {
        // A full frame's lines, each either blank (ignored - CRLF normalization can leave one),
        // a `:`-prefixed comment (ignored), `event: <name>`, or `data: <json>`.
        let eventName = null
        let dataLine = null
        for (const rawLine of frame.split('\n')) {
            const line = rawLine.trimEnd()
            if (!line || line.startsWith(':')) {
                continue
            }
            if (line.startsWith('event:')) {
                eventName = line.slice('event:'.length).trim()
            } else if (line.startsWith('data:')) {
                dataLine = line.slice('data:'.length).trim()
            }
        }
        if (!eventName) {
            return
        }
        let data = null
        if (dataLine) {
            try {
                data = JSON.parse(dataLine)
            } catch (e) {
                // Malformed data line: surface the frame anyway with the raw text, rather than
                // silently dropping a frame the UI might need to react to (e.g. an error event).
                data = dataLine
            }
        }
        onEvent(eventName, data)
    }

    const push = (chunk) => {
        if (!chunk) {
            return
        }
        buffer += chunk.replace(/\r\n/g, '\n')
        // Frames are separated by a blank line (`\n\n`). Keep whatever's after the last `\n\n`
        // in the buffer, since it may be an incomplete frame still arriving.
        let splitAt
        while ((splitAt = buffer.indexOf('\n\n')) !== -1) {
            const frame = buffer.slice(0, splitAt)
            buffer = buffer.slice(splitAt + 2)
            if (frame.trim()) {
                handleFrame(frame)
            }
        }
    }

    return {push}
}

export default createSseParser
