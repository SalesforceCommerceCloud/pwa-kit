/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {handoffToShopperAgent} from '@salesforce/retail-react-app/app/utils/shopper-agent-handoff'

const originalCimulate = window.CimulateMessaging
const originalBootstrap = window.embeddedservice_bootstrap

beforeEach(() => {
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
    it('returns a no-op result when no provider is on window', async () => {
        jest.useFakeTimers()
        const pending = handoffToShopperAgent({question: 'is this fish-safe?'})
        jest.advanceTimersByTime(10000)
        const result = await pending
        jest.useRealTimers()
        expect(result).toEqual({opened: false, seeded: false, provider: 'none'})
    })

    it('waits for a late SDK and sends the first question once', async () => {
        jest.useFakeTimers()
        const pending = handoffToShopperAgent({question: 'first click'})
        const sendMessage = jest.fn()
        installCommerceClient({sendMessage})
        jest.advanceTimersByTime(50)
        expect(await pending).toEqual({opened: true, seeded: true, provider: 'commerce-client'})
        expect(sendMessage).toHaveBeenCalledTimes(1)
        jest.useRealTimers()
    })

    it('cancels a pending handoff when the PDP unmounts', async () => {
        jest.useFakeTimers()
        const controller = new AbortController()
        const pending = handoffToShopperAgent({question: 'old product', signal: controller.signal})
        controller.abort()
        const sendMessage = jest.fn()
        installCommerceClient({sendMessage})
        jest.advanceTimersByTime(10000)
        expect(await pending).toEqual({opened: false, seeded: false, provider: 'none'})
        expect(sendMessage).not.toHaveBeenCalled()
        expect(jest.getTimerCount()).toBe(0)
        jest.useRealTimers()
    })

    it('returns a no-op result when the question is empty or whitespace', async () => {
        installCommerceClient()
        expect(await handoffToShopperAgent({question: ''})).toEqual({
            opened: false,
            seeded: false,
            provider: 'none'
        })
        expect(await handoffToShopperAgent({question: '   '})).toEqual({
            opened: false,
            seeded: false,
            provider: 'none'
        })
        expect(await handoffToShopperAgent({})).toEqual({
            opened: false,
            seeded: false,
            provider: 'none'
        })
    })

    it('opens the Commerce Client widget and seeds via sendMessage when available', async () => {
        const sendMessage = jest.fn()
        const {toggleWidgetOpen} = installCommerceClient({sendMessage})

        const result = await handoffToShopperAgent({
            question: 'does this work with sensitive skin?',
            productContext: {productId: '500400', productName: 'Serum'}
        })

        expect(toggleWidgetOpen).toHaveBeenCalledWith(true)
        expect(sendMessage).toHaveBeenCalledWith('does this work with sensitive skin?')
        expect(result).toEqual({opened: true, seeded: true, provider: 'commerce-client'})
    })

    it('falls through to seeded=false when Commerce Client exposes no send method', async () => {
        const {toggleWidgetOpen} = installCommerceClient()
        const result = await handoffToShopperAgent({question: 'any send?'})

        expect(toggleWidgetOpen).toHaveBeenCalledWith(true)
        expect(result).toEqual({opened: true, seeded: false, provider: 'commerce-client'})
    })

    it('tries alternate send method names (sendUserMessage) when sendMessage is missing', async () => {
        const sendUserMessage = jest.fn()
        installCommerceClient({sendUserMessage})

        const result = await handoffToShopperAgent({question: 'hi'})
        expect(sendUserMessage).toHaveBeenCalledWith('hi')
        expect(result.seeded).toBe(true)
    })

    it('swallows errors from the send call and still reports opened=true', async () => {
        const sendMessage = jest.fn(() => {
            throw new Error('boom')
        })
        installCommerceClient({sendMessage})

        const result = await handoffToShopperAgent({question: 'boom test'})
        expect(result).toEqual({opened: true, seeded: false, provider: 'commerce-client'})
        expect(console.error).toHaveBeenCalled()
    })

    it('handles an asynchronous send rejection without reporting a seeded question', async () => {
        installCommerceClient({sendMessage: jest.fn().mockRejectedValue(new Error('unavailable'))})
        expect(await handoffToShopperAgent({question: 'retry later'})).toEqual({
            opened: true,
            seeded: false,
            provider: 'commerce-client'
        })
        expect(console.error).toHaveBeenCalled()
    })

    it.each(['sync', 'async'])(
        'does not try another method after a %s send failure',
        async (failure) => {
            const sendMessage = jest.fn(() => {
                if (failure === 'sync') throw new Error('delivery uncertain')
                return Promise.reject(new Error('delivery uncertain'))
            })
            const sendUserMessage = jest.fn()
            const sendUserText = jest.fn()
            installCommerceClient({sendMessage, sendUserMessage, sendUserText})
            const result = await handoffToShopperAgent({question: 'send once'})
            expect(result.seeded).toBe(false)
            expect(sendMessage).toHaveBeenCalledTimes(1)
            expect(sendUserMessage).not.toHaveBeenCalled()
            expect(sendUserText).not.toHaveBeenCalled()
        }
    )

    it('opens MIAW with a warning but does not attempt to seed', async () => {
        const {launchChat} = installMiaw()
        const result = await handoffToShopperAgent({question: 'miaw path'})

        expect(launchChat).toHaveBeenCalledTimes(1)
        expect(result).toEqual({opened: true, seeded: false, provider: 'miaw'})
        expect(console.warn).toHaveBeenCalled()
    })

    it('trims leading/trailing whitespace from the question', async () => {
        const sendMessage = jest.fn()
        installCommerceClient({sendMessage})
        await handoffToShopperAgent({question: '  padded?  '})
        expect(sendMessage).toHaveBeenCalledWith('padded?')
    })

    it('primes Cimulate pageContext with productId before sending', async () => {
        const sendMessage = jest.fn()
        const {pageContextSet} = installCommerceClient({sendMessage})

        await handoffToShopperAgent({
            question: 'size question',
            productContext: {productId: '500400', productName: 'TrailFit Alta'}
        })

        expect(pageContextSet).toHaveBeenCalledWith({type: 'pdp', id: '500400'})
        const setOrder = pageContextSet.mock.invocationCallOrder[0]
        const sendOrder = sendMessage.mock.invocationCallOrder[0]
        expect(setOrder).toBeLessThan(sendOrder)
    })

    it('skips pageContext.set when productId is missing', async () => {
        const sendMessage = jest.fn()
        const {pageContextSet} = installCommerceClient({sendMessage})
        await handoffToShopperAgent({question: 'no product id'})
        expect(pageContextSet).not.toHaveBeenCalled()
        expect(sendMessage).toHaveBeenCalledWith('no product id')
    })
})
