/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    createSearchContexts,
    appendTurn,
    conversationMessages,
    conversationHistory
} from '@salesforce/retail-react-app/app/server/search-assistant/session-store'
import {followUpSuggestions} from '@salesforce/retail-react-app/app/server/search-assistant/suggestions'

const args = {
    authorization: 'Bearer verified-shopper',
    searchUrl: 'https://test.api.commercecloud.salesforce.com/search',
    parameters: {q: 'boots', currency: 'USD', locale: 'en-US'},
    result: {
        total: 3,
        hits: [
            {productId: 'a', productName: 'Trail Boot', price: 80},
            {productId: 'b', productName: 'Mountain Boot', price: 160},
            {productId: 'c', productName: 'Winter Boot', price: 220}
        ],
        refinements: [
            {
                attributeId: 'features',
                label: 'Features',
                values: [{label: 'Waterproof', hitCount: 2}]
            }
        ]
    }
}
test('one session retains independent conversations for different searches', () => {
    const store = createSearchContexts()
    const first = store.put(args)
    appendTurn(first, {
        question: 'boots',
        answer: 'First is Trail Boot; second is Mountain Boot.',
        kind: 'overview',
        picks: [...first.products.values()]
    })
    appendTurn(first, {question: 'Which is cheaper?', answer: 'Trail Boot costs $80.'})
    const next = store.put({
        ...args,
        parameters: {...args.parameters, q: 'jackets'},
        sessionId: first.session.id
    })
    expect(next.id).not.toBe(first.id)
    expect(next.session).toBe(first.session)
    expect(next.session.turns).toHaveLength(2)
    expect(conversationHistory(next)).toEqual([])
    expect(conversationMessages(next)).toEqual([])
    appendTurn(next, {
        question: 'jackets',
        answer: 'Here are the current jackets.',
        kind: 'overview'
    })
    expect(conversationMessages(next)).toEqual([
        expect.objectContaining({role: 'user', content: expect.stringContaining('jackets')}),
        {role: 'assistant', content: 'Here are the current jackets.'}
    ])
    expect(conversationHistory(first)).toHaveLength(2)
    expect(JSON.stringify(conversationMessages(first))).not.toContain('current jackets')
    expect(() =>
        store.put({...args, authorization: 'Bearer another-shopper', sessionId: first.session.id})
    ).toThrow('expired')
    expect(store.get(first.id, 'Bearer another-shopper')).toBeUndefined()
})
test('a conversation has a bounded transcript and cannot be revived after expiry', () => {
    let now = 0
    const store = createSearchContexts({now: () => now, ttl: 1000})
    const entry = store.put(args)
    for (let i = 0; i < 12; i++)
        appendTurn(entry, {question: `Question ${i}`, answer: 'x'.repeat(9000)})
    expect(entry.session.turns).toHaveLength(8)
    expect(entry.session.turns[0].question).toBe('Question 4')
    expect(entry.session.turns[0].text).toHaveLength(6000)
    expect(JSON.stringify(entry.session)).not.toContain(args.authorization)
    now = 1001
    expect(() => store.put({...args, sessionId: entry.session.id})).toThrow('expired')
})
test('suggestions use real product identities, price variation and result facets, then drop answered questions', () => {
    const entry = createSearchContexts().put(args)
    const suggestions = followUpSuggestions(entry)
    expect(suggestions.map(({question}) => question)).toEqual([
        'Compare Trail Boot with Mountain Boot.',
        'What are my options under $150?',
        'Which options have the “Waterproof” feature?'
    ])
    appendTurn(entry, {question: suggestions[0].question, answer: 'A comparison.'})
    expect(followUpSuggestions(entry).map(({question}) => question)).not.toContain(
        suggestions[0].question
    )
    const other = createSearchContexts().put({
        ...args,
        result: {
            ...args.result,
            hits: [{productId: 'x', productName: 'Sun Hat', price: 25}],
            refinements: [
                {attributeId: 'material', values: [{label: 'Recycled fabric', hitCount: 1}]}
            ]
        }
    })
    expect(followUpSuggestions(other).map(({question}) => question)).toEqual([
        'Which matches use recycled fabric?'
    ])
    other.total = 0
    expect(followUpSuggestions(other)).toEqual([])
})

test('pagination shares current-search memory, while changed filters do not', () => {
    const store = createSearchContexts()
    const first = store.put(args)
    appendTurn(first, {question: 'Which is cheaper?', answer: 'The trail boot.'})
    const page = store.put({
        ...args,
        sessionId: first.session.id,
        parameters: {...args.parameters, offset: 25, limit: 25, expand: ['images']}
    })
    expect(page.searchKey).toBe(first.searchKey)
    expect(conversationHistory(page)).toHaveLength(1)
    const filtered = store.put({
        ...args,
        sessionId: first.session.id,
        parameters: {...args.parameters, refine: ['color=blue']}
    })
    expect(filtered.session.id).toBe(first.session.id)
    expect(filtered.searchKey).not.toBe(first.searchKey)
    expect(conversationHistory(filtered)).toEqual([])
})
