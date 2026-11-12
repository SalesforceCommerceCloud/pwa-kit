/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {openShopperAgentWidget} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

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

const trySendViaCimulate = async (question) => {
    const session = window.CimulateMessaging?.eventHandlers?.session
    const sendCandidates = ['sendMessage', 'sendUserMessage', 'sendUserText']
    const method = sendCandidates.find((candidate) => typeof session?.[candidate] === 'function')
    if (!method) return false
    try {
        await session[method](question)
        return true
    } catch (err) {
        console.error(`Shopper Agent handoff: ${method} threw`, err)
        return false
    }
}

const waitForProvider = (signal) =>
    new Promise((resolve) => {
        const deadline = Date.now() + 10000
        let timer
        const finish = (provider) => {
            clearTimeout(timer)
            signal?.removeEventListener('abort', abort)
            resolve(provider)
        }
        const abort = () => finish('none')
        const check = () => {
            const provider = detectProvider()
            if (signal?.aborted || provider !== 'none' || Date.now() >= deadline) {
                finish(signal?.aborted ? 'none' : provider)
                return
            }
            timer = setTimeout(check, 50)
        }
        signal?.addEventListener('abort', abort, {once: true})
        check()
    })

export const handoffToShopperAgent = async ({question, productContext = {}, signal} = {}) => {
    if (!onClient) return {opened: false, seeded: false, provider: 'none'}

    const trimmed = typeof question === 'string' ? question.trim() : ''
    if (!trimmed) return {opened: false, seeded: false, provider: 'none'}

    if (signal?.aborted) return {opened: false, seeded: false, provider: 'none'}
    let provider = detectProvider()
    if (provider === 'none') provider = await waitForProvider(signal)
    if (provider === 'none' || signal?.aborted) {
        console.warn('Shopper Agent handoff: no provider detected on window')
        return {opened: false, seeded: false, provider}
    }

    if (provider === 'miaw') {
        console.warn(
            'Shopper Agent handoff: MIAW does not expose a programmatic send API. Opening the chat; shopper will need to retype the question. Switch to Commerce Client provider for a seamless handoff.'
        )
    }

    openShopperAgentWidget()

    let seeded = false
    if (provider === 'commerce-client') {
        primeCimulatePageContext(productContext)
        seeded = await trySendViaCimulate(trimmed)
    }

    return {opened: true, seeded, provider}
}

export default handoffToShopperAgent
