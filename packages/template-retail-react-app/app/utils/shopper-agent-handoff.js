/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {openShopperAgentWidget} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

export const SHOPPER_AGENT_SEED_EVENT = 'shopper-agent:seed-question'
export const SHOPPER_AGENT_SEED_STORAGE_KEY = 'shopper-agent-seed-question'

const onClient = typeof window !== 'undefined'

const detectProvider = () => {
    if (!onClient) return 'none'
    if (window.CimulateMessaging?.eventHandlers?.components?.toggleWidgetOpen) {
        return 'commerce-client'
    }
    if (window.embeddedservice_bootstrap?.utilAPI?.launchChat) {
        return 'miaw'
    }
    return 'none'
}

const primeCimulatePageContext = (productContext) => {
    const productId = productContext?.productId
    if (!productId) return
    const pageContextApi = window.CimulateMessaging?.eventHandlers?.pageContext
    if (typeof pageContextApi?.set !== 'function') return
    try {
        pageContextApi.set({type: 'pdp', id: String(productId)})
    } catch (err) {
        console.error('Shopper Agent handoff: pageContext.set threw', err)
    }
}

const trySendViaCimulate = (question) => {
    const session = window.CimulateMessaging?.eventHandlers?.session
    const sendCandidates = ['sendMessage', 'sendUserMessage', 'sendUserText']
    for (const method of sendCandidates) {
        if (typeof session?.[method] === 'function') {
            try {
                session[method](question)
                return true
            } catch (err) {
                console.error(`Shopper Agent handoff: ${method} threw`, err)
            }
        }
    }
    return false
}

/**
 * Hand off a shopper question from the PDP inline surface to the main
 * Shopper Agent drawer. Opens the drawer, seeds the question, and attaches
 * product context so the agent can answer in context.
 *
 * The seed is published three ways so downstream listeners can pick the
 * channel that fits them: a `SHOPPER_AGENT_SEED_EVENT` CustomEvent, a
 * `sessionStorage` key, and (if the Cimulate SDK ever exposes a programmatic
 * send) a direct call. The drawer itself is opened regardless.
 *
 * @param {Object} params
 * @param {string} params.question - The question the shopper tapped or typed
 * @param {Object} [params.productContext] - { productId, productName, pdpUrl }
 */
export const handoffToShopperAgent = ({question, productContext = {}} = {}) => {
    if (!onClient) return {opened: false, seeded: false, provider: 'none'}

    const trimmed = typeof question === 'string' ? question.trim() : ''
    if (!trimmed) return {opened: false, seeded: false, provider: 'none'}

    const provider = detectProvider()
    if (provider === 'none') {
        console.warn('Shopper Agent handoff: no provider detected on window')
        return {opened: false, seeded: false, provider}
    }

    if (provider === 'miaw') {
        console.warn(
            'Shopper Agent handoff: MIAW does not expose a programmatic send API. Opening the chat; shopper will need to retype the question. Switch to Commerce Client provider for a seamless handoff.'
        )
    }

    const seed = {
        question: trimmed,
        productContext,
        timestamp: Date.now()
    }

    try {
        window.sessionStorage.setItem(SHOPPER_AGENT_SEED_STORAGE_KEY, JSON.stringify(seed))
    } catch (err) {
        console.error('Shopper Agent handoff: sessionStorage write failed', err)
    }

    openShopperAgentWidget()

    let seeded = false
    if (provider === 'commerce-client') {
        primeCimulatePageContext(productContext)
        seeded = trySendViaCimulate(trimmed)
    }

    try {
        window.dispatchEvent(
            new CustomEvent(SHOPPER_AGENT_SEED_EVENT, {detail: seed})
        )
    } catch (err) {
        console.error('Shopper Agent handoff: dispatch failed', err)
    }

    return {opened: true, seeded, provider}
}

/**
 * Read and clear the one-shot seed stashed in `sessionStorage`. The drawer
 * host calls this on mount so the question survives a storefront navigation
 * from the PDP into the drawer-aware route tree.
 *
 * @returns {{question: string, productContext: Object, timestamp: number}|null}
 */
export const consumePersistedSeed = () => {
    if (!onClient) return null
    try {
        const raw = window.sessionStorage.getItem(SHOPPER_AGENT_SEED_STORAGE_KEY)
        if (!raw) return null
        window.sessionStorage.removeItem(SHOPPER_AGENT_SEED_STORAGE_KEY)
        return JSON.parse(raw)
    } catch (err) {
        console.error('Shopper Agent handoff: consume seed failed', err)
        return null
    }
}

export default handoffToShopperAgent
