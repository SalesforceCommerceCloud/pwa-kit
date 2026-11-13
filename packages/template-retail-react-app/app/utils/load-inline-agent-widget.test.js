/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const SOURCE = 'https://cdn.search.cimulate.ai/inline-agent-widget/0.1.0/inline-agent-widget.umd.js'

describe('inline widget script registration', () => {
    let load
    let register
    let getSpy
    let definedSpy
    let warningSpy

    beforeEach(async () => {
        jest.resetModules()
        jest.useFakeTimers()
        load = (await import('./load-inline-agent-widget')).default
        let constructor
        let resolve
        const registered = new Promise((yes) => {
            resolve = yes
        })
        getSpy = jest.spyOn(customElements, 'get').mockImplementation(() => constructor)
        definedSpy = jest.spyOn(customElements, 'whenDefined').mockReturnValue(registered)
        register = () => {
            constructor = class extends HTMLElement {}
            resolve(constructor)
        }
        warningSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
        document.head
            .querySelectorAll(`script[src="${SOURCE}"]`)
            .forEach((script) => script.remove())
        jest.restoreAllMocks()
        jest.useRealTimers()
    })

    const script = () => document.querySelector(`script[src="${SOURCE}"]`)

    test('an already registered element needs no download or warning timer', async () => {
        register()
        await load(SOURCE)
        expect(getSpy()).toBeDefined()
        expect(script()).toBeNull()
        expect(definedSpy).not.toHaveBeenCalled()
        expect(jest.getTimerCount()).toBe(0)
    })

    test('concurrent consumers share registration and one listener-bound script', async () => {
        const first = load(SOURCE)
        expect(load(SOURCE)).toBe(first)
        expect(document.querySelectorAll(`script[src="${SOURCE}"]`)).toHaveLength(1)
        expect(script().async).toBe(true)
        expect(script().getAttribute('data-react-helmet')).toBe('true')
        expect(definedSpy).toHaveBeenCalledTimes(1)
        register()
        await first
        expect(jest.getTimerCount()).toBe(0)
        script().dispatchEvent(new Event('error'))
        expect(script()).not.toBeNull()
        expect(load(SOURCE)).toBe(first)
    })

    test('registration before the warning threshold reuses the original SSR node', async () => {
        const existing = document.createElement('script')
        existing.src = SOURCE
        document.head.appendChild(existing)
        const appendSpy = jest.spyOn(document.head, 'appendChild')
        const waiting = load(SOURCE)
        jest.advanceTimersByTime(9999)
        register()
        await waiting
        jest.advanceTimersByTime(1)
        expect(warningSpy).not.toHaveBeenCalled()
        expect(script()).toBe(existing)
        expect(appendSpy).not.toHaveBeenCalled()
        expect(jest.getTimerCount()).toBe(0)
    })

    test.each(['stalled', 'loaded without registration', 'failed before hydration'])(
        'warns once for a script that %s and still accepts late registration',
        async (condition) => {
            const existing = document.createElement('script')
            existing.src = SOURCE
            document.head.appendChild(existing)
            if (condition === 'failed before hydration') existing.dispatchEvent(new Event('error'))
            const waiting = load(SOURCE)
            const completed = jest.fn()
            waiting.then(completed, () => {})
            if (condition === 'loaded without registration')
                existing.dispatchEvent(new Event('load'))
            jest.advanceTimersByTime(9999)
            expect(warningSpy).not.toHaveBeenCalled()
            jest.advanceTimersByTime(1)
            await Promise.resolve()
            expect(warningSpy).toHaveBeenCalledWith(
                'Inline agent widget CDN script registration is taking longer than 10 seconds'
            )
            expect(completed).not.toHaveBeenCalled()
            expect(script()).toBe(existing)
            expect(load(SOURCE)).toBe(waiting)
            jest.advanceTimersByTime(20000)
            expect(warningSpy).toHaveBeenCalledTimes(1)
            register()
            await waiting
            expect(completed).toHaveBeenCalledTimes(1)
            expect(jest.getTimerCount()).toBe(0)
            existing.dispatchEvent(new Event('error'))
            expect(script()).toBe(existing)
        }
    )

    test('reattaches the same pending script after head-manager removal', async () => {
        const first = load(SOURCE)
        const detached = script()
        detached.remove()
        expect(load(SOURCE)).toBe(first)
        expect(script()).toBe(detached)
        expect(jest.getTimerCount()).toBe(1)
        const failure = first.catch((error) => error)
        detached.dispatchEvent(new Event('error'))
        expect(await failure).toEqual(new Error('Inline agent widget CDN script failed to load'))
        const retry = load(SOURCE)
        expect(script()).not.toBe(detached)
        register()
        await retry
        expect(load(SOURCE)).toBe(retry)
        expect(jest.getTimerCount()).toBe(0)
    })

    test.each([0, 10000])(
        'a download error after %i ms removes the failed tag and permits retry',
        async (delay) => {
            const waiting = load(SOURCE)
            const failed = script()
            const failure = waiting.catch((error) => error)
            jest.advanceTimersByTime(delay)
            failed.dispatchEvent(new Event('error'))
            expect(await failure).toEqual(
                new Error('Inline agent widget CDN script failed to load')
            )
            expect(failed.isConnected).toBe(false)
            expect(jest.getTimerCount()).toBe(0)
            const retry = load(SOURCE)
            expect(script()).not.toBe(failed)
            register()
            await Promise.resolve()
            expect(load(SOURCE)).toBe(retry)
            await retry
            expect(jest.getTimerCount()).toBe(0)
        }
    )
})
