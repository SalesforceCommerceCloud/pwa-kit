/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {TextDecoder} from 'node:util'
import {readOverview} from '@salesforce/retail-react-app/app/utils/commerce-agent-turn'

const originalDecoder = global.TextDecoder
beforeAll(() => {
    global.TextDecoder = TextDecoder
})
afterAll(() => {
    global.TextDecoder = originalDecoder
})

function response(...chunks) {
    const reader = {
        read: jest.fn().mockResolvedValue({done: true}),
        cancel: jest.fn().mockResolvedValue(),
        releaseLock: jest.fn()
    }
    for (const chunk of chunks)
        reader.read.mockResolvedValueOnce({value: Buffer.from(chunk), done: false})
    return {
        ok: true,
        headers: {get: () => 'text/event-stream'},
        body: {getReader: () => reader}
    }
}

test('appends only matching AI deltas and completes after split CRLF frames', async () => {
    const stream = response(
        ': ok\r\n\r\n',
        'event: content_delta\r\ndata: {"turnId":"turn_other","content":{"type":"ai_overview","delta":"other"}}\r\n\r\n',
        'event: content_delta\r\ndata: {"turnId":"turn_123","content":{"type":"ai_overview","delta":"One vest."}}\r',
        '\n\r\nevent: completed\r\ndata: {"turnId":"turn_123"}\r\n\r\n'
    )
    const onDelta = jest.fn()
    await readOverview(stream, 'turn_123', onDelta)
    expect(onDelta.mock.calls).toEqual([['One vest.']])
    expect(stream.body.getReader().releaseLock).toHaveBeenCalled()
})

test('reports a truncated stream instead of finishing without a terminal event', async () => {
    await expect(readOverview(response(': ok\n\n'), 'turn_123', () => {})).rejects.toThrow(
        'ended early'
    )
})
