/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// Trusted Agent (Order on Behalf) login. For the callback contract, the COOP
// same-origin behaviour, upgrade steps, and how to reproduce and verify the flow,
// see ../../TRUSTED_AGENT_RUNBOOK.md.
import {useState, useEffect, useCallback} from 'react'
import {useMutation} from '@tanstack/react-query'
import useAuthContext from './useAuthContext'
import {ShopperLoginTypes} from 'commerce-sdk-isomorphic'
import {onClient} from '../utils'

type TokenResponse = ShopperLoginTypes.TokenResponse
type UseTrustedAgent = {
    isAgent: boolean
    agentId: string | null
    loginId: string | null
    login: (loginId?: string, usid?: string) => Promise<TokenResponse>
    logout: () => Promise<TokenResponse>
}

let popup: Window | null
let intervalId: NodeJS.Timer
// Cancels the currently-active popup flow: tears down its listener, broadcast
// channel, and poll timer, and rejects its pending promise so a superseding
// login() call never leaves the prior caller awaiting forever. Tracked at module
// scope because only one trusted-agent popup flow can be active at a time.
let cancelActivePopup: (() => void) | null = null

/**
 * `type` discriminator for the message the same-origin OAuth callback page posts
 * back to `window.opener` (and broadcasts on {@link TRUSTED_AGENT_POPUP_CHANNEL}).
 * Exported so the callback route can import the exact contract instead of
 * hard-coding a string.
 */
export const TRUSTED_AGENT_POPUP_MESSAGE_TYPE = 'salesforce:trusted-agent-popup-callback'

/**
 * Name of the BroadcastChannel used as a same-origin fallback for delivering the
 * OAuth result. `postMessage(window.opener)` is the primary path; BroadcastChannel
 * covers cases where the opener reference is unusable after a COOP-induced
 * browsing-context-group switch.
 */
export const TRUSTED_AGENT_POPUP_CHANNEL = 'salesforce:trusted-agent-popup'

type TrustedAgentPopupMessage = {
    type: string
    code?: string | null
    state?: string | null
}

/**
 * Delivers the Trusted Agent OAuth result from the same-origin `/callback` page back
 * to the opener that started the flow via {@link createTrustedAgentPopup}.
 *
 * Under `Cross-Origin-Opener-Policy: same-origin` the opener can no longer read the
 * popup's location, so the popup must hand the result back out-of-band. This reads
 * the popup's own same-origin URL (always readable) and posts `{type, code, state}`
 * to `window.opener` scoped to our origin (primary), plus a same-origin
 * `BroadcastChannel` broadcast (fallback for when the opener reference is unusable
 * after a COOP-induced browsing-context-group switch).
 *
 * No-op on the server, and when the URL carries no `code`/`state` (for example the
 * standard SLAS login redirect), so it is safe to call unconditionally on `/callback`.
 */
export const deliverTrustedAgentResult = (): void => {
    if (!onClient()) {
        return
    }

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')

    // Not a trusted-agent callback (no OAuth result present) — nothing to deliver.
    if (!code || !state) {
        return
    }

    const message: TrustedAgentPopupMessage = {type: TRUSTED_AGENT_POPUP_MESSAGE_TYPE, code, state}
    let deliveredToOpener = false
    let broadcast = false

    // Primary: post to the opener, scoped to our own origin so the message is not
    // exposed to any other document.
    if (window.opener) {
        try {
            window.opener.postMessage(message, window.location.origin)
            deliveredToOpener = true
        } catch (e) {
            // Opener may be unavailable/severed after a COOP context-group switch;
            // the broadcast fallback covers this. Logged so a rolled-out failure is
            // diagnosable from the console.
            console.warn('Trusted agent callback could not post to the opener.', e)
        }
    }

    // Fallback: a same-origin BroadcastChannel survives a COOP context-group switch.
    try {
        if (typeof BroadcastChannel !== 'undefined') {
            const channel = new BroadcastChannel(TRUSTED_AGENT_POPUP_CHANNEL)
            channel.postMessage(message)
            channel.close()
            broadcast = true
        }
    } catch (e) {
        // Here to catch environments without BroadcastChannel support.
        console.warn('Trusted agent callback could not broadcast the result.', e)
    }

    // Neither path delivered: the opener will fall back to its timeout, so surface
    // why here rather than leaving the login silently hanging.
    if (!deliveredToOpener && !broadcast) {
        console.warn('Trusted agent callback could not deliver the OAuth result to the opener.')
        return
    }

    // Close the popup from its own context. The opener also calls `popup.close()`,
    // but under COOP `same-origin` its reference to us is a severed WindowProxy where
    // `close()` is unreliable, so the popup could otherwise linger after a successful
    // login. A window may only close a window opened by script, which the trusted
    // agent popup is. Deferred so the queued postMessage/broadcast flushes first.
    try {
        setTimeout(() => {
            try {
                window.close()
            } catch (e) {
                /* closing may be blocked in some environments; the opener still settles */
            }
        }, 0)
    } catch (e) {
        /* here to catch environments without setTimeout */
    }
}

/**
 * Hook for the same-origin `/callback` route to hand a Trusted Agent (Order on
 * Behalf) OAuth result back to the opener. Mount it on the callback page; it runs
 * {@link deliverTrustedAgentResult} once on mount. It is a no-op unless the URL
 * carries both `code` and `state`, so it is safe to mount on a shared `/callback`
 * page that also handles the standard SLAS login redirect.
 *
 * @group Helpers
 * @category Shopper Authentication
 * @experimental
 */
export const useTrustedAgentPopupCallback = (): void => {
    useEffect(() => {
        deliverTrustedAgentResult()
    }, [])
}

const getCodeAndStateValueFromPopup = (
    popup: Window | null
): {code: string | null; state: string | null} => {
    let code = null
    let state = null

    try {
        const url = new URL(popup?.location?.toString() || 'http://localhost')
        code = url.searchParams.get('code')
        state = url.searchParams.get('state')
    } catch (e) {
        /* here to catch invalid URL or crossdomain popup access errors */
    }

    return {code, state}
}

export const createTrustedAgentPopup = async (
    url: string,
    isRefresh = false,
    timeoutMinutes = 5,
    refreshTimeoutFocusMinutes = 1
): Promise<{code: string; state: string}> => {
    // if a prior popup flow is still active, cancel it: reject its pending promise
    // (so the prior caller doesn't hang) and tear down its listener/channel/timer
    if (cancelActivePopup) {
        cancelActivePopup()
    }

    // if a popup already exists, close it
    if (popup) {
        popup?.close()
    }

    // if a timer already exists, clear it
    if (intervalId) {
        clearInterval(intervalId)
    }

    // create our popup
    popup =
        window?.open?.(
            url,
            'accountManagerPopup',
            'popup=true,width=800,height=800,scrollbars=false,status=false,location=false,menubar=false,toolbar=false'
        ) || null

    // if this is intended to be a behind the
    // scenes refresh call, make sure our main
    // window stays focused
    if (isRefresh) {
        window?.focus?.()
    }

    const startTime = Date.now()

    return new Promise((resolve, reject) => {
        // The storefront may send `Cross-Origin-Opener-Policy: same-origin`, which
        // triggers a browsing-context-group switch when the Account Manager authorize
        // URL loads. That severs the popup's WindowProxy: `popup.location` throws a
        // SecurityError (so we can never read `code`/`state` back) and `popup.closed`
        // returns a false-positive `true`. To stay robust we accept the OAuth result
        // out-of-band: the same-origin callback page posts `{type, code, state}` to
        // `window.opener` (primary), with a BroadcastChannel as a same-origin fallback.
        let settled = false
        let messageListener: ((event: MessageEvent) => void) | null = null
        let broadcastChannel: BroadcastChannel | null = null

        const teardown = () => {
            if (intervalId) {
                clearInterval(intervalId)
            }
            if (messageListener) {
                window?.removeEventListener?.('message', messageListener)
                messageListener = null
            }
            if (broadcastChannel) {
                broadcastChannel.close()
                broadcastChannel = null
            }
            if (cancelActivePopup === cancel) {
                cancelActivePopup = null
            }
        }

        const settleResolve = (result: {code: string; state: string}) => {
            if (settled) return
            settled = true
            teardown()
            popup?.close()
            resolve(result)
        }

        const settleReject = (reason: string) => {
            if (settled) return
            settled = true
            teardown()
            reject(reason)
        }

        // Cancel path used when a new flow supersedes this one. Reject the pending
        // promise so the superseded caller settles instead of awaiting forever; the
        // new flow closes/reopens the shared popup window itself.
        const cancel = () => settleReject('Popup superseded by a new authentication request.')
        cancelActivePopup = cancel

        // Handle a callback delivered via postMessage or BroadcastChannel. Only
        // same-origin messages carrying our discriminator are honored; a payload
        // missing `code`/`state` is ignored (keep waiting) rather than rejected.
        const handleCallbackMessage = (data: unknown, origin?: string) => {
            if (settled) return
            // For postMessage, enforce same-origin. BroadcastChannel is same-origin
            // by construction, so `origin` is undefined there and skips this check.
            if (typeof origin === 'string' && origin !== window?.location?.origin) {
                return
            }
            const message = data as TrustedAgentPopupMessage | null
            if (!message || message.type !== TRUSTED_AGENT_POPUP_MESSAGE_TYPE) {
                return
            }
            const {code, state} = message
            if (code && state) {
                settleResolve({code, state})
            }
        }

        messageListener = (event: MessageEvent) => handleCallbackMessage(event.data, event.origin)
        window?.addEventListener?.('message', messageListener)

        // BroadcastChannel may be unavailable in some environments; guard its use.
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                broadcastChannel = new BroadcastChannel(TRUSTED_AGENT_POPUP_CHANNEL)
                broadcastChannel.onmessage = (event: MessageEvent) =>
                    handleCallbackMessage(event.data)
            }
        } catch (e) {
            /* here to catch environments without BroadcastChannel support */
        }

        const checkPopupState = () => {
            if (settled) return

            const popupCouldntInitialize = !popup
            if (popupCouldntInitialize) {
                return settleReject("Popup couldn't initialize. Check your popup blocker.")
            }

            // success state — still supported for same-origin (non-COOP) redirects,
            // where the popup's location remains readable.
            const {code, state} = getCodeAndStateValueFromPopup(popup)
            if (code && state) {
                return settleResolve({code, state})
            }

            // NOTE: We intentionally no longer reject on `popup?.closed`. Under COOP
            // the severed proxy reports `closed === true` while the popup is still
            // open and authenticating, so treating it as user-abandonment produced a
            // false failure. Genuine abandonment is caught by the bounded timeout
            // below instead.

            const popupTimeoutOccurred =
                Math.floor(Date.now() - startTime) > timeoutMinutes * 1000 * 60
            if (popupTimeoutOccurred) {
                popup?.close()
                return settleReject(`Popup timed out after ${timeoutMinutes} minutes.`)
            }

            // if our refresh flow is stuck, focus the popup window
            const popupRefreshTimeoutOccurred =
                Math.floor(Date.now() - startTime) > refreshTimeoutFocusMinutes * 1000 * 60
            if (isRefresh && popupRefreshTimeoutOccurred) {
                popup?.focus()
            }
        }

        checkPopupState()
        // The synchronous check above can already settle (for example when the popup
        // was blocked). Only start the poll timer if we are still waiting, otherwise
        // it would spin as a no-op until the next flow clears it.
        if (!settled) {
            intervalId = setInterval(checkPopupState, 1000)
        }
    })
}

/**
 * A hook to return trusted agent state.
 *
 * @group Helpers
 * @category Shopper Authentication
 * @experimental
 *
 */
const useTrustedAgent = (): UseTrustedAgent => {
    const auth = useAuthContext()
    const [isAgent, setIsAgent] = useState(false)
    const [agentId, setAgentId] = useState('')
    const [loginId, setLoginId] = useState('')

    const authorizeTrustedAgent = useMutation(auth.authorizeTrustedAgent.bind(auth))
    const loginTrustedAgent = useMutation(auth.loginTrustedAgent.bind(auth))
    const logoutTrustedAgent = useMutation(auth.logout.bind(auth))

    const login = useCallback(
        async (loginId?: string, usid?: string, refresh = false): Promise<TokenResponse> => {
            if (!onClient()) {
                throw new Error(
                    'Something went wrong, this client side method is invoked on the server.'
                )
            }

            const {
                url,
                codeVerifier,
                state: expectedState
            } = await authorizeTrustedAgent.mutateAsync({loginId})
            const {code, state} = await createTrustedAgentPopup(url, refresh)
            // CSRF check: the `state` echoed back through the popup must match the one we
            // minted for this authorize request. SLAS also binds `state`↔`code` on the
            // token request below, but comparing here fails fast and stops a mismatched
            // code from ever being exchanged.
            if (state !== expectedState) {
                throw new Error(
                    'Trusted agent login failed: state mismatch on authentication callback.'
                )
            }
            return await loginTrustedAgent.mutateAsync({
                loginId,
                code,
                codeVerifier,
                state,
                usid
            })
        },
        [auth]
    )

    const logout = useCallback(async () => {
        return await logoutTrustedAgent.mutateAsync()
    }, [auth])

    useEffect(() => {
        auth.registerTrustedAgentRefreshHandler(login)
    }, [auth])

    useEffect(() => {
        const parsed = auth.parseSlasJWT(auth.get('access_token'))
        if (parsed) {
            setIsAgent(parsed.isAgent)
            setAgentId(parsed.agentId || '')
            setLoginId(parsed.loginId)
        }
    }, [auth.get('access_token')])

    return {isAgent, agentId, loginId, login, logout}
}

export default useTrustedAgent
