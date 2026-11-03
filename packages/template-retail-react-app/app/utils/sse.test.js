/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {createSseParser} from '@salesforce/retail-react-app/app/utils/sse'

const collect = () => {
    const events = []
    const parser = createSseParser((name, data) => events.push([name, data]))
    return {parser, events}
}

test('parses a single complete frame', () => {
    const {parser, events} = collect()
    parser.push('event: status\ndata: {"stage":"understanding"}\n\n')
    expect(events).toEqual([['status', {stage: 'understanding'}]])
})

test('parses multiple frames arriving in one chunk', () => {
    const {parser, events} = collect()
    parser.push(
        'event: status\ndata: {"stage":"understanding"}\n\n' +
            'event: status\ndata: {"stage":"searching"}\n\n'
    )
    expect(events).toEqual([
        ['status', {stage: 'understanding'}],
        ['status', {stage: 'searching'}]
    ])
})

test('reassembles a frame split across multiple chunks', () => {
    const {parser, events} = collect()
    parser.push('event: del')
    parser.push('ta\ndata: {"te')
    parser.push('xt":"hi"}\n\n')
    expect(events).toEqual([['delta', {text: 'hi'}]])
})

test('reassembles a frame split exactly at the blank-line separator', () => {
    const {parser, events} = collect()
    parser.push('event: done\ndata: {"chars":5}\n')
    expect(events).toEqual([]) // not yet - the second \n hasn't arrived
    parser.push('\n')
    expect(events).toEqual([['done', {chars: 5}]])
})

test('ignores comment lines', () => {
    const {parser, events} = collect()
    parser.push(': ok\n\n')
    parser.push('event: status\ndata: {"stage":"understanding"}\n\n')
    expect(events).toEqual([['status', {stage: 'understanding'}]])
})

test('handles CRLF line endings', () => {
    const {parser, events} = collect()
    parser.push('event: status\r\ndata: {"stage":"answering"}\r\n\r\n')
    expect(events).toEqual([['status', {stage: 'answering'}]])
})

test('a frame with no data line still fires with null data', () => {
    const {parser, events} = collect()
    parser.push('event: done\n\n')
    expect(events).toEqual([['done', null]])
})

test('drops a trailing partial frame with no closing blank line', () => {
    const {parser, events} = collect()
    parser.push('event: delta\ndata: {"text":"hi"}\n\n')
    parser.push('event: delta\ndata: {"text":"incomplete, never closed')
    expect(events).toEqual([['delta', {text: 'hi'}]])
})

test('push with empty string is a no-op', () => {
    const {parser, events} = collect()
    parser.push('')
    expect(events).toEqual([])
})

test('a malformed data line surfaces the raw text instead of throwing', () => {
    const {parser, events} = collect()
    expect(() => parser.push('event: error\ndata: not-json\n\n')).not.toThrow()
    expect(events).toEqual([['error', 'not-json']])
})
