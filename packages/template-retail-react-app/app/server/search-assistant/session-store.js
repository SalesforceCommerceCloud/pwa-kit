/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {createHash, randomUUID} from 'crypto'
import {productFact} from '../catalog-facts'

const fingerprint = (authorization) => createHash('sha256').update(authorization).digest('hex')
const expiry = (authorization, now, ttl) => {
    let expires = now + ttl
    try {
        const claims = JSON.parse(
            Buffer.from(authorization.split(' ')[1].split('.')[1], 'base64url').toString()
        )
        if (Number.isFinite(claims.exp)) expires = Math.min(expires, claims.exp * 1000 - 15000)
    } catch {
        /* Opaque tokens stay bound to the original SCAPI-validated token. */
    }
    return expires
}

// Pagination and response expansions do not change the search's product scope.
const searchScopeKey = (parameters) =>
    createHash('sha256')
        .update(
            JSON.stringify({
                query: parameters.q.trim().replace(/\s+/g, ' ').toLowerCase(),
                siteId: parameters.siteId,
                locale: parameters.locale,
                currency: parameters.currency,
                sort: parameters.sort || 'best-matches',
                refine: [
                    ...(Array.isArray(parameters.refine)
                        ? parameters.refine
                        : parameters.refine
                        ? [parameters.refine]
                        : [])
                ].sort()
            })
        )
        .digest('hex')

// One shopper-bound session owns search-scoped conversations and result contexts. Nothing here is logged or persisted to disk.
export function createSearchContexts({now = Date.now, ttl = 10 * 60 * 1000, limit = 60} = {}) {
    const records = new Map()
    const sessions = new Map()
    const prune = () => {
        for (const [id, session] of sessions) if (session.expires <= now()) sessions.delete(id)
        for (const [id, entry] of records) if (!sessions.has(entry.session.id)) records.delete(id)
    }
    const findSession = (id, authorization) => {
        prune()
        const session = sessions.get(id)
        return session?.owner === fingerprint(authorization) ? session : undefined
    }
    return {
        findSession,
        put({parameters, result, authorization, searchUrl, sessionId}) {
            prune()
            let session = sessionId ? findSession(sessionId, authorization) : undefined
            if (sessionId && !session) {
                const error = new Error('Search session expired')
                error.status = 404
                throw error
            }
            if (!session) {
                while (sessions.size >= limit) sessions.delete(sessions.keys().next().value)
                session = {
                    id: randomUUID(),
                    owner: fingerprint(authorization),
                    expires: expiry(authorization, now(), ttl),
                    turns: [],
                    revision: 0,
                    busy: false
                }
                sessions.set(session.id, session)
            }
            while (records.size >= limit) records.delete(records.keys().next().value)
            const entry = {
                id: randomUUID(),
                session,
                searchKey: searchScopeKey(parameters),
                parameters: JSON.parse(JSON.stringify(parameters)),
                searchUrl: String(searchUrl),
                total: result.total || 0,
                refinements: result.refinements || [],
                products: new Map(
                    (result.hits || []).map((product) => {
                        const fact = productFact(product)
                        return [fact.id, fact]
                    })
                ),
                details: false
            }
            records.set(entry.id, entry)
            return entry
        },
        get(id, authorization) {
            prune()
            const entry = records.get(id)
            return entry && findSession(entry.session.id, authorization) ? entry : undefined
        }
    }
}

export function appendTurn(entry, {question, answer, picks = [], kind = 'answer'}) {
    const session = entry.session
    session.revision++
    session.turns.push({
        id: `${session.id}:${session.revision}`,
        contextId: entry.id,
        searchKey: entry.searchKey,
        kind,
        query: entry.parameters.q,
        question: question.slice(0, 1200),
        text: answer.slice(0, 6000),
        picks: picks.slice(0, 3).map(({id, name, price, image}) => ({id, name, price, image}))
    })
    session.turns = session.turns.slice(-8)
}

export const conversationMessages = (entry) =>
    conversationHistory(entry).flatMap((turn) => [
        {
            role: 'user',
            content: JSON.stringify({
                query: turn.query,
                question: turn.question,
                shown_products: turn.picks.map(({id, name, price}) => ({id, name, price}))
            })
        },
        {role: 'assistant', content: turn.text}
    ])

export const conversationHistory = (entry) =>
    entry.session.turns.filter((turn) => turn.searchKey === entry.searchKey)
