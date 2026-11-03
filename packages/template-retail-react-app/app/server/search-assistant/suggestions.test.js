/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {refreshSuggestions} from '@salesforce/retail-react-app/app/server/search-assistant/suggestions'

const entry = () => ({
    parameters: {q: 'jacket', locale: 'en-US', currency: 'USD'},
    total: 2,
    searchKey: 'jackets',
    refinements: [],
    products: new Map([
        ['rain', {id: 'rain', name: 'Rain shell', price: 100}],
        ['down', {id: 'down', name: 'Down jacket', price: 200}]
    ]),
    session: {turns: []}
})
const turn = (state, question, text, searchKey = state.searchKey) =>
    state.session.turns.push({question, text, searchKey})

test('refreshes after consecutive answers using only the active conversation and latest answer', async () => {
    const state = entry()
    const gateway = {complete: jest.fn()}
    const signal = new AbortController().signal
    turn(state, 'Find bike computers', 'Unrelated bike answer', 'bikes')
    const rounds = [
        [
            'jacket',
            'A rain shell and a down jacket.',
            ['Which is suitable for rain?', 'Compare their prices?', 'Which is lighter?']
        ],
        [
            'Which is suitable for rain?',
            'The shell lists rain protection.',
            [
                'What does the shell cost?',
                'Compare the shell with the down jacket?',
                'What care details are listed?'
            ]
        ],
        [
            'What care details are listed?',
            'The catalog does not specify care.',
            [
                'How do the prices compare?',
                'Which details should I verify before buying?',
                'Show me a different jacket?'
            ]
        ]
    ]
    for (const [question, answer, suggestions] of rounds) {
        turn(state, question, answer)
        gateway.complete.mockResolvedValueOnce(JSON.stringify(suggestions))
        const result = await refreshSuggestions(state, gateway, signal)
        expect(result.map((s) => s.question)).toEqual(suggestions)
        const messages = gateway.complete.mock.calls.at(-1)[0]
        const context = JSON.parse(messages[1].content)
        expect(context.conversation.at(-1)).toEqual({question, answer})
        expect(messages[1].content).not.toContain('bike')
    }
    expect(gateway.complete).toHaveBeenCalledTimes(3)
})

test('validates generated questions and removes asked, previous, duplicate and unsafe entries', async () => {
    const state = entry()
    turn(state, 'Which is lighter?', 'Unknown')
    state.suggestions = [{question: 'Compare the prices?'}]
    const gateway = {
        complete: jest
            .fn()
            .mockResolvedValue(
                JSON.stringify([
                    null,
                    ' WHICH IS LIGHTER! ',
                    'Compare the prices.',
                    '<img src=x>',
                    'https://example.com',
                    'line\nbreak',
                    'x'.repeat(131),
                    'What sizes are listed?',
                    'What sizes are listed!',
                    'What should I verify?',
                    'Show another jacket?',
                    'Ignored fourth valid question?'
                ])
            )
    }
    const result = await refreshSuggestions(state, gateway, new AbortController().signal)
    expect(result.map((s) => s.question)).toEqual([
        'What sizes are listed?',
        'What should I verify?',
        'Show another jacket?'
    ])
})

test.each(['not JSON', '{}', '[]'])(
    'metadata failure %s preserves a usable catalog-grounded fallback',
    async (text) => {
        const state = entry()
        turn(state, 'Compare Rain shell with Down jacket.', 'Different prices')
        turn(state, 'What are my options under $150?', 'The shell')
        const result = await refreshSuggestions(
            state,
            {complete: jest.fn().mockResolvedValue(text)},
            new AbortController().signal
        )
        expect(result.length).toBeGreaterThan(0)
        expect(result.some((s) => /Rain shell|Down jacket/.test(s.question))).toBe(true)
        expect(result.map((s) => s.question)).not.toContain('Compare Rain shell with Down jacket.')
    }
)

test('bounds suggestion latency and cancels a disconnect without emitting stale questions', async () => {
    jest.useFakeTimers()
    try {
        const gateway = {
            complete: jest.fn(
                (messages, signal) =>
                    new Promise((resolve, reject) => {
                        signal.addEventListener('abort', () => reject(new Error('cancelled')), {
                            once: true
                        })
                    })
            )
        }
        const first = refreshSuggestions(entry(), gateway, new AbortController().signal)
        await jest.advanceTimersByTimeAsync(5000)
        expect((await first).length).toBeGreaterThan(0)
        const controller = new AbortController()
        const second = refreshSuggestions(entry(), gateway, controller.signal)
        controller.abort()
        expect(await second).toEqual([])
        expect(jest.getTimerCount()).toBe(0)
        expect(await refreshSuggestions(entry(), gateway, controller.signal)).toEqual([])
    } finally {
        jest.useRealTimers()
    }
})
