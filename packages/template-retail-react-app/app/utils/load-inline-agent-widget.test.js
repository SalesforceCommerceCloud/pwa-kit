/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const SOURCE = 'https://cdn.search.cimulate.ai/inline-agent-widget/0.1.0/inline-agent-widget.umd.js'

const deferred = () => {
    let resolve
    let reject
    const promise = new Promise((yes, no) => {
        resolve = yes
        reject = no
    })
    return {promise, resolve, reject}
}

describe('inline widget script registration', () => {
    let load
    let registration
    let getSpy
    let definedSpy

    beforeEach(async () => {
        jest.resetModules()
        jest.useFakeTimers()
        load = (await import('./load-inline-agent-widget')).default
        registration = deferred()
        getSpy = jest.spyOn(customElements, 'get').mockReturnValue(undefined)
        definedSpy = jest.spyOn(customElements, 'whenDefined').mockReturnValue(registration.promise)
    })

    afterEach(() => {
        document.head
            .querySelectorAll(`script[src="${SOURCE}"]`)
            .forEach((script) => script.remove())
        jest.restoreAllMocks()
        jest.useRealTimers()
    })

    const script = () => document.querySelector(`script[src="${SOURCE}"]`)

    test('an already registered element needs no download or timeout', async () => {
        getSpy.mockReturnValue(class extends HTMLElement {})
        await load(SOURCE)
        expect(script()).toBeNull()
        expect(definedSpy).not.toHaveBeenCalled()
        expect(jest.getTimerCount()).toBe(0)
    })

    test('concurrent consumers share registration and one listener-bound script', async () => {
        const first = load(SOURCE)
        const second = load(SOURCE)
        expect(second).toBe(first)
        expect(document.querySelectorAll(`script[src="${SOURCE}"]`)).toHaveLength(1)
        expect(script().async).toBe(true)
        expect(script().getAttribute('data-react-helmet')).toBe('true')
        expect(definedSpy).toHaveBeenCalledTimes(1)
        expect(jest.getTimerCount()).toBe(1)
        registration.resolve()
        await first
        expect(jest.getTimerCount()).toBe(0)
        script().dispatchEvent(new Event('error'))
        expect(script()).not.toBeNull()
        expect(load(SOURCE)).toBe(first)
    })

    test('successful registration reuses the original SSR node', async () => {
        const existing = document.createElement('script')
        existing.src = SOURCE
        document.head.appendChild(existing)
        const appendSpy = jest.spyOn(document.head, 'appendChild')
        const waiting = load(SOURCE)
        registration.resolve()
        await waiting
        expect(script()).toBe(existing)
        expect(appendSpy).not.toHaveBeenCalled()
        expect(jest.getTimerCount()).toBe(0)
    })

    test.each(['stalled', 'loaded without registration', 'failed before hydration'])(
        'bounds waiting for a script that %s and keeps the in-flight node',
        async (condition) => {
            const existing = document.createElement('script')
            existing.src = SOURCE
            document.head.appendChild(existing)
            if (condition === 'failed before hydration') existing.dispatchEvent(new Event('error'))
            const waiting = load(SOURCE)
            const failure = waiting.catch((error) => error)
            if (condition === 'loaded without registration')
                existing.dispatchEvent(new Event('load'))
            jest.advanceTimersByTime(9999)
            expect(jest.getTimerCount()).toBe(1)
            jest.advanceTimersByTime(1)
            expect(await failure).toEqual(
                new Error('Inline agent widget CDN script registration timed out')
            )
            expect(script()).toBe(existing)
            expect(jest.getTimerCount()).toBe(0)
            existing.dispatchEvent(new Event('error'))
            expect(script()).toBe(existing)
            const nextRegistration = deferred()
            definedSpy.mockReturnValue(nextRegistration.promise)
            const retry = load(SOURCE)
            expect(retry).not.toBe(waiting)
            expect(script()).toBe(existing)
            registration.resolve()
            await Promise.resolve()
            expect(load(SOURCE)).toBe(retry)
            expect(jest.getTimerCount()).toBe(1)
            nextRegistration.resolve()
            await retry
            expect(jest.getTimerCount()).toBe(0)
        }
    )

    test('an observed download error removes the failed tag and allows a fresh attempt', async () => {
        const waiting = load(SOURCE)
        const failed = script()
        const failure = waiting.catch((error) => error)
        failed.dispatchEvent(new Event('error'))
        expect(await failure).toEqual(new Error('Inline agent widget CDN script failed to load'))
        expect(failed.isConnected).toBe(false)
        expect(jest.getTimerCount()).toBe(0)
        const nextRegistration = deferred()
        definedSpy.mockReturnValue(nextRegistration.promise)
        const retry = load(SOURCE)
        expect(script()).not.toBe(failed)
        registration.resolve()
        await Promise.resolve()
        expect(load(SOURCE)).toBe(retry)
        nextRegistration.resolve()
        await retry
        expect(jest.getTimerCount()).toBe(0)
    })

    test('a registry rejection cleans up and permits another wait without replacing the tag', async () => {
        const waiting = load(SOURCE)
        const existing = script()
        const failure = waiting.catch((error) => error)
        registration.reject(new Error('registry unavailable'))
        expect(await failure).toEqual(new Error('registry unavailable'))
        expect(jest.getTimerCount()).toBe(0)
        definedSpy.mockResolvedValue(undefined)
        await load(SOURCE)
        expect(script()).toBe(existing)
        expect(jest.getTimerCount()).toBe(0)
    })
})
