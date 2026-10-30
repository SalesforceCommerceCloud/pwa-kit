/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    handoffToShopperAgent,
    consumePersistedSeed,
    SHOPPER_AGENT_SEED_EVENT,
    SHOPPER_AGENT_SEED_STORAGE_KEY
} from '@salesforce/retail-react-app/app/utils/shopper-agent-handoff'

const originalCimulate = window.CimulateMessaging
const originalBootstrap = window.embeddedservice_bootstrap

beforeEach(() => {
    window.sessionStorage.clear()
    delete window.CimulateMessaging
    delete window.embeddedservice_bootstrap
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
    jest.restoreAllMocks()
    window.CimulateMessaging = originalCimulate
    window.embeddedservice_bootstrap = originalBootstrap
})

const installCommerceClient = (sessionOverrides = {}, pageContextOverrides) => {
    const toggleWidgetOpen = jest.fn()
    const pageContextSet = jest.fn()
    window.CimulateMessaging = {
        eventHandlers: {
            components: {toggleWidgetOpen},
            session: sessionOverrides,
            pageContext: pageContextOverrides || {set: pageContextSet}
        }
    }
    return {toggleWidgetOpen, pageContextSet}
}

const installMiaw = () => {
    const launchChat = jest.fn()
    window.embeddedservice_bootstrap = {utilAPI: {launchChat}}
    return {launchChat}
}

describe('handoffToShopperAgent', () => {
    it('returns a no-op result when no provider is on window', () => {
        const result = handoffToShopperAgent({question: 'is this fish-safe?'})
        expect(result).toEqual({opened: false, seeded: false, provider: 'none'})
    })

    it('returns a no-op result when the question is empty or whitespace', () => {
        installCommerceClient()
        expect(handoffToShopperAgent({question: ''})).toEqual({
            opened: false,
            seeded: false,
            provider: 'none'
        })
        expect(handoffToShopperAgent({question: '   '})).toEqual({
            opened: false,
            seeded: false,
            provider: 'none'
        })
        expect(handoffToShopperAgent({})).toEqual({
            opened: false,
            seeded: false,
            provider: 'none'
        })
    })

    it('opens the Commerce Client widget and seeds via sendMessage when available', () => {
        const sendMessage = jest.fn()
        const {toggleWidgetOpen} = installCommerceClient({sendMessage})

        const listener = jest.fn()
        window.addEventListener(SHOPPER_AGENT_SEED_EVENT, listener)

        const result = handoffToShopperAgent({
            question: 'does this work with sensitive skin?',
            productContext: {productId: '500400', productName: 'Serum'}
        })

        expect(toggleWidgetOpen).toHaveBeenCalledWith(true)
        expect(sendMessage).toHaveBeenCalledWith('does this work with sensitive skin?')
        expect(result).toEqual({opened: true, seeded: true, provider: 'commerce-client'})

        expect(listener).toHaveBeenCalledTimes(1)
        const dispatched = listener.mock.calls[0][0].detail
        expect(dispatched.question).toBe('does this work with sensitive skin?')
        expect(dispatched.productContext).toEqual({productId: '500400', productName: 'Serum'})

        window.removeEventListener(SHOPPER_AGENT_SEED_EVENT, listener)
    })

    it('persists the seed to sessionStorage for cross-nav pickup', () => {
        installCommerceClient()
        handoffToShopperAgent({
            question: 'ask about fit',
            productContext: {productId: 'abc'}
        })

        const stored = JSON.parse(window.sessionStorage.getItem(SHOPPER_AGENT_SEED_STORAGE_KEY))
        expect(stored.question).toBe('ask about fit')
        expect(stored.productContext).toEqual({productId: 'abc'})
    })

    it('falls through to seeded=false when Commerce Client exposes no send method', () => {
        const {toggleWidgetOpen} = installCommerceClient()
        const result = handoffToShopperAgent({question: 'any send?'})

        expect(toggleWidgetOpen).toHaveBeenCalledWith(true)
        expect(result).toEqual({opened: true, seeded: false, provider: 'commerce-client'})
    })

    it('tries alternate send method names (sendUserMessage) when sendMessage is missing', () => {
        const sendUserMessage = jest.fn()
        installCommerceClient({sendUserMessage})

        const result = handoffToShopperAgent({question: 'hi'})
        expect(sendUserMessage).toHaveBeenCalledWith('hi')
        expect(result.seeded).toBe(true)
    })

    it('swallows errors from the send call and still reports opened=true', () => {
        const sendMessage = jest.fn(() => {
            throw new Error('boom')
        })
        installCommerceClient({sendMessage})

        const result = handoffToShopperAgent({question: 'boom test'})
        expect(result).toEqual({opened: true, seeded: false, provider: 'commerce-client'})
        expect(console.error).toHaveBeenCalled()
    })

    it('opens MIAW with a warning but does not attempt to seed', () => {
        const {launchChat} = installMiaw()
        const listener = jest.fn()
        window.addEventListener(SHOPPER_AGENT_SEED_EVENT, listener)

        const result = handoffToShopperAgent({question: 'miaw path'})

        expect(launchChat).toHaveBeenCalledTimes(1)
        expect(result).toEqual({opened: true, seeded: false, provider: 'miaw'})
        expect(console.warn).toHaveBeenCalled()
        // Event still fires so bespoke host integrations can react
        expect(listener).toHaveBeenCalledTimes(1)

        window.removeEventListener(SHOPPER_AGENT_SEED_EVENT, listener)
    })

    it('trims leading/trailing whitespace from the question', () => {
        const sendMessage = jest.fn()
        installCommerceClient({sendMessage})
        handoffToShopperAgent({question: '  padded?  '})
        expect(sendMessage).toHaveBeenCalledWith('padded?')
    })

    it('primes Cimulate pageContext with productId before sending', () => {
        const sendMessage = jest.fn()
        const {pageContextSet} = installCommerceClient({sendMessage})

        handoffToShopperAgent({
            question: 'size question',
            productContext: {productId: '500400', productName: 'TrailFit Alta'}
        })

        expect(pageContextSet).toHaveBeenCalledWith({type: 'pdp', id: '500400'})
        const setOrder = pageContextSet.mock.invocationCallOrder[0]
        const sendOrder = sendMessage.mock.invocationCallOrder[0]
        expect(setOrder).toBeLessThan(sendOrder)
    })

    it('skips pageContext.set when productId is missing', () => {
        const sendMessage = jest.fn()
        const {pageContextSet} = installCommerceClient({sendMessage})
        handoffToShopperAgent({question: 'no product id'})
        expect(pageContextSet).not.toHaveBeenCalled()
        expect(sendMessage).toHaveBeenCalledWith('no product id')
    })
})

describe('consumePersistedSeed', () => {
    it('returns null when there is no seed', () => {
        expect(consumePersistedSeed()).toBeNull()
    })

    it('returns the seed and clears sessionStorage on consume', () => {
        window.sessionStorage.setItem(
            SHOPPER_AGENT_SEED_STORAGE_KEY,
            JSON.stringify({question: 'x', productContext: {}, timestamp: 1})
        )
        const seed = consumePersistedSeed()
        expect(seed).toEqual({question: 'x', productContext: {}, timestamp: 1})
        expect(window.sessionStorage.getItem(SHOPPER_AGENT_SEED_STORAGE_KEY)).toBeNull()
    })

    it('returns null and clears on malformed JSON', () => {
        window.sessionStorage.setItem(SHOPPER_AGENT_SEED_STORAGE_KEY, '{not-json')
        expect(consumePersistedSeed()).toBeNull()
    })
})
