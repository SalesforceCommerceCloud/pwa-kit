/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Trusted Agent Order-on-Behalf login under Cross-Origin-Opener-Policy: same-origin.
 *
 * When the storefront sends `Cross-Origin-Opener-Policy: same-origin`, opening the
 * Account Manager authorize URL causes a browsing-context-group switch. The browser
 * severs the `WindowProxy` returned by `window.open`:
 *
 *   - reading `popup.location` throws a SecurityError (cross-origin access), and
 *   - `popup.closed` returns `true` even though the popup is still open and the
 *     agent is mid-authentication.
 *
 * The current polling implementation in `createTrustedAgentPopup` (see
 * `useTrustedAgent.ts`) treats `popup.closed === true` as "the user closed the
 * popup" and rejects with 'Popup closed without authenticating.' on the very first
 * poll — before the agent can finish. Because the proxy is severed, the redirect
 * URL (which carries `code` + `state`) can never be read back through
 * `popup.location`, so the success path is unreachable too.
 *
 * The fix delivers the OAuth result out-of-band: the same-origin callback page posts
 * `{type, code, state}` back to `window.opener` (with a BroadcastChannel fallback),
 * and the poller stops hard-rejecting on a severed `.closed`, relying on the bounded
 * timeout to detect genuine abandonment.
 *
 * These tests assert the FIXED behavior, so they are red against the current
 * implementation and green once the fix lands.
 */
import {createTrustedAgentPopup, TRUSTED_AGENT_POPUP_MESSAGE_TYPE} from './useTrustedAgent'

// jsdom is reconfigured to this origin in setup-jest.js. The callback page is a
// same-origin storefront route, so postMessage/BroadcastChannel are same-origin.
const STOREFRONT_ORIGIN = 'https://www.domain.com'

const AUTHORIZE_URL =
    'https://account.demandware.com/dwsso/oauth2/authorize?client_id=test&response_type=code'

/**
 * Builds a mock `WindowProxy` that mimics what a real browser hands back after a
 * COOP-induced browsing-context-group switch: `.closed` is a false-positive `true`
 * and `.location` access throws a SecurityError.
 */
const makeCoopSeveredPopup = () => ({
    close: jest.fn(),
    focus: jest.fn(),
    // Severed proxy false-positive: reports closed while the popup is still open.
    get closed() {
        return true
    },
    // Severed proxy: any property access on location throws cross-origin SecurityError.
    get location(): Location {
        const err = new Error(
            'Blocked a frame with origin "https://www.domain.com" from accessing a cross-origin frame.'
        )
        err.name = 'SecurityError'
        throw err
    }
})

/** Simulate the same-origin callback page posting the OAuth result to its opener. */
const postCallbackResult = (code: string, state: string, origin: string = STOREFRONT_ORIGIN) => {
    window.dispatchEvent(
        new MessageEvent('message', {
            origin,
            data: {type: TRUSTED_AGENT_POPUP_MESSAGE_TYPE, code, state}
        })
    )
}

describe('createTrustedAgentPopup — COOP-severed popup', () => {
    const originalOpen = window.open

    beforeEach(() => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.clearAllTimers()
        jest.useRealTimers()
        window.open = originalOpen
        jest.restoreAllMocks()
    })

    test('does NOT reject a COOP-severed popup as "closed" while auth is in progress', async () => {
        window.open = jest.fn().mockReturnValue(makeCoopSeveredPopup())

        let settled: 'resolved' | 'rejected' | null = null
        const promise = createTrustedAgentPopup(AUTHORIZE_URL).then(
            () => (settled = 'resolved'),
            () => (settled = 'rejected')
        )

        // Advance several poll cycles. The severed proxy keeps reporting closed:true,
        // but that must NOT be interpreted as an abandoned popup.
        jest.advanceTimersByTime(3000)
        await Promise.resolve()

        // BUG (current code): rejects immediately with 'Popup closed without
        // authenticating.', so `settled === 'rejected'`.
        expect(settled).toBeNull()

        // Let the flow complete via the callback so we don't leak a pending timer.
        postCallbackResult('cleanup_code', 'cleanup_state')
        await promise
    })

    test('resolves with {code, state} delivered via postMessage from the callback page', async () => {
        window.open = jest.fn().mockReturnValue(makeCoopSeveredPopup())

        const promise = createTrustedAgentPopup(AUTHORIZE_URL)

        postCallbackResult('auth_code_123', 'state_abc')
        jest.advanceTimersByTime(1000)

        await expect(promise).resolves.toEqual({code: 'auth_code_123', state: 'state_abc'})
    })

    test('ignores postMessage from a foreign origin', async () => {
        window.open = jest.fn().mockReturnValue(makeCoopSeveredPopup())

        const promise = createTrustedAgentPopup(AUTHORIZE_URL)
        let settled: 'resolved' | 'rejected' | null = null
        promise.then(
            () => (settled = 'resolved'),
            () => (settled = 'rejected')
        )

        // A message from an attacker-controlled origin must be ignored.
        postCallbackResult('evil_code', 'evil_state', 'https://evil.example.com')
        jest.advanceTimersByTime(2000)
        await Promise.resolve()

        expect(settled).toBeNull()

        // The genuine same-origin callback still resolves it.
        postCallbackResult('auth_code_123', 'state_abc')
        await expect(promise).resolves.toEqual({code: 'auth_code_123', state: 'state_abc'})
    })

    test('rejects via the bounded timeout when a COOP-severed popup is genuinely abandoned', async () => {
        window.open = jest.fn().mockReturnValue(makeCoopSeveredPopup())

        const timeoutMinutes = 5
        const promise = createTrustedAgentPopup(AUTHORIZE_URL, false, timeoutMinutes)
        // Capture the rejection reason before advancing timers so the eventual
        // rejection is always observed (and never surfaces as an unhandled rejection).
        let rejectionReason: unknown = null
        const captured = promise.catch((reason) => {
            rejectionReason = reason
        })

        // No callback message ever arrives → genuine abandonment. The ONLY signal
        // that should end the flow is the bounded timeout, not the false .closed.
        jest.advanceTimersByTime(timeoutMinutes * 60 * 1000 + 1000)

        await captured
        expect(rejectionReason).toMatch(/timed out/i)
    })
})
