/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useRef, useState, useEffect, useCallback} from 'react'

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/**
 * Load the Turnstile script once. Returns true when window.turnstile is ready.
 * @returns {{ isReady: boolean }}
 */
function useTurnstileScript() {
    const [isReady, setIsReady] = useState(() => typeof window !== 'undefined' && !!window.turnstile)
    const loadingRef = useRef(false)

    useEffect(() => {
        if (typeof window === 'undefined' || window.turnstile) {
            if (window?.turnstile) setIsReady(true)
            return
        }
        if (loadingRef.current) return
        loadingRef.current = true

        const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT_URL}"]`)
        if (existing) {
            const onLoad = () => setIsReady(!!window.turnstile)
            existing.addEventListener('load', onLoad)
            if (window.turnstile) onLoad()
            return () => existing.removeEventListener('load', onLoad)
        }

        const script = document.createElement('script')
        script.src = TURNSTILE_SCRIPT_URL
        script.async = true
        script.defer = true
        script.onload = () => setIsReady(!!window.turnstile)
        script.onerror = () => {
            loadingRef.current = false
        }
        document.head.appendChild(script)
    }, [])

    return {isReady}
}

/**
 * Hook to use Cloudflare Turnstile (invisible widget) for protecting an action (e.g. passwordless login).
 * Loads the script, renders an invisible widget with execution on demand, and exposes getToken().
 *
 * @param {string} siteKey - Turnstile site key (from Cloudflare dashboard). If empty, hook is no-op.
 * @param {object} containerRef - Ref for the div where the widget will be rendered (optional; hook can manage internally).
 * @returns {{ getToken: () => Promise<string>, isReady: boolean, widgetId: string | null, turnstileContainerRef: React.RefObject }}
 */
export function useTurnstile(siteKey, containerRef) {
    const internalContainerRef = useRef(null)
    const containerRefToUse = containerRef || internalContainerRef
    const {isReady: scriptReady} = useTurnstileScript()
    const widgetIdRef = useRef(null)
    const resolveRef = useRef(null)
    const rejectRef = useRef(null)
    const [isReady, setIsReady] = useState(false)

    const renderWidget = useCallback(() => {
        if (typeof window === 'undefined' || !window.turnstile || !siteKey) return
        const el = containerRefToUse.current
        if (!el) return
        if (widgetIdRef.current !== null) {
            setIsReady(true)
            return
        }

        try {
            const id = window.turnstile.render(el, {
                sitekey: siteKey,
                size: 'invisible',
                execution: 'execute',
                callback: (token) => {
                    if (resolveRef.current) {
                        resolveRef.current(token)
                        resolveRef.current = null
                        rejectRef.current = null
                    }
                },
                'error-callback': () => {
                    if (rejectRef.current) {
                        rejectRef.current(new Error('Turnstile challenge failed'))
                        rejectRef.current = null
                        resolveRef.current = null
                    }
                }
            })
            widgetIdRef.current = id
            setIsReady(true)
        } catch (e) {
            console.warn('Turnstile render failed:', e)
        }
    }, [siteKey, containerRefToUse])

    useEffect(() => {
        if (!scriptReady || !siteKey) return
        const t = setTimeout(renderWidget, 0)
        return () => {
            clearTimeout(t)
            if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current !== null) {
                try {
                    window.turnstile.remove(widgetIdRef.current)
                } catch (_) {}
                widgetIdRef.current = null
            }
            setIsReady(false)
        }
    }, [scriptReady, siteKey, renderWidget])

    const getToken = useCallback(() => {
        if (!siteKey) return Promise.resolve(null)
        if (!window.turnstile || widgetIdRef.current === null) {
            return Promise.reject(new Error('Turnstile not ready'))
        }
        return new Promise((resolve, reject) => {
            resolveRef.current = resolve
            rejectRef.current = reject
            try {
                window.turnstile.execute(widgetIdRef.current)
            } catch (e) {
                rejectRef.current = null
                resolveRef.current = null
                reject(e)
            }
        })
    }, [siteKey])

    return {
        getToken,
        isReady: !!siteKey && scriptReady && isReady,
        widgetId: widgetIdRef.current,
        turnstileContainerRef: containerRefToUse
    }
}

export default useTurnstile
