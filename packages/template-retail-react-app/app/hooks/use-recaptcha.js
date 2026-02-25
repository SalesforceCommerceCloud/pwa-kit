/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useRef, useState, useEffect, useCallback} from 'react'

/**
 * Build reCAPTCHA v2 script URL. Render=explicit for v2 invisible widget.
 * We do not use the onload param to avoid React Strict Mode cleanup deleting the callback before the script runs.
 */
function getRecaptchaScriptUrl() {
    const base = 'https://www.google.com/recaptcha/api.js'
    const params = new URLSearchParams({render: 'explicit'})
    return `${base}?${params.toString()}`
}

/**
 * Returns true if grecaptcha has the v2 API (render method). v3 only has execute(siteKey), not render().
 */
function isRecaptchaV2() {
    return typeof window !== 'undefined' && window.grecaptcha && typeof window.grecaptcha.render === 'function'
}

/**
 * Returns true if an existing script is reCAPTCHA v2 (render=explicit). v3 uses render=SITEKEY.
 */
function hasV2Script() {
    if (typeof document === 'undefined') return false
    const script = document.querySelector('script[src*="recaptcha/api.js"]')
    return !!script && script.src.includes('render=explicit')
}

/**
 * Load the reCAPTCHA script once when enabled. Returns true when window.grecaptcha is ready.
 * When enabled is false, does not load the script (so we only load reCAPTCHA when using it, not when using Turnstile).
 * @param {boolean} enabled - If false, script is not loaded
 * @returns {{ isReady: boolean }}
 */
function useRecaptchaScript(enabled = true) {
    const [isReady, setIsReady] = useState(() => isRecaptchaV2())
    const loadingRef = useRef(false)

    useEffect(() => {
        if (!enabled) return
        // Already have v2 API (render exists) - no need to load
        if (isRecaptchaV2()) {
            setIsReady(true)
            return
        }
        // Existing v2 script - wait for grecaptcha.ready or poll until v2 API is available
        if (hasV2Script()) {
            if (window.grecaptcha?.ready) {
                window.grecaptcha.ready(() => setIsReady(isRecaptchaV2()))
            } else {
                const id = setInterval(() => {
                    if (isRecaptchaV2()) {
                        setIsReady(true)
                        clearInterval(id)
                    }
                }, 50)
                return () => clearInterval(id)
            }
            return
        }
        if (loadingRef.current) return
        loadingRef.current = true

        const scriptUrl = getRecaptchaScriptUrl()
        const script = document.createElement('script')
        script.src = scriptUrl
        script.async = true
        script.defer = true
        script.onload = () => {
            if (window.grecaptcha?.ready) {
                window.grecaptcha.ready(() => setIsReady(isRecaptchaV2()))
            } else {
                setIsReady(isRecaptchaV2())
            }
        }
        script.onerror = () => {
            loadingRef.current = false
        }
        document.head.appendChild(script)
    }, [enabled])

    return {isReady: enabled ? isReady : false}
}

/**
 * Hook to use Google reCAPTCHA v2 invisible for protecting an action (e.g. passwordless login).
 * Loads the script, renders an invisible widget, and exposes getToken().
 *
 * @param {string} siteKey - reCAPTCHA site key (from Google reCAPTCHA admin). If empty, hook is no-op.
 * @param {object} containerRef - Ref for the div where the widget will be rendered (optional).
 * @returns {{ getToken: () => Promise<string>, isReady: boolean, recaptchaContainerRef: React.RefObject }}
 */
export function useRecaptcha(siteKey, containerRef) {
    const internalContainerRef = useRef(null)
    const containerRefToUse = containerRef || internalContainerRef
    const {isReady: scriptReady} = useRecaptchaScript(!!siteKey)
    const widgetIdRef = useRef(null)
    const resolveRef = useRef(null)
    const rejectRef = useRef(null)
    const [isReady, setIsReady] = useState(false)

    const renderWidget = useCallback(() => {
        if (typeof window === 'undefined' || !isRecaptchaV2() || !siteKey) return
        const el = containerRefToUse.current
        if (!el) return
        if (widgetIdRef.current !== null) {
            setIsReady(true)
            return
        }

        try {
            const id = window.grecaptcha.render(el, {
                sitekey: siteKey,
                size: 'invisible',
                badge: 'inline',
                callback: (token) => {
                    if (resolveRef.current) {
                        resolveRef.current(token || '')
                        resolveRef.current = null
                        rejectRef.current = null
                    }
                },
                'error-callback': () => {
                    if (rejectRef.current) {
                        rejectRef.current(new Error('reCAPTCHA challenge failed'))
                        rejectRef.current = null
                        resolveRef.current = null
                    }
                }
            })
            widgetIdRef.current = id
            setIsReady(true)
        } catch (e) {
            console.warn('reCAPTCHA render failed:', e)
        }
    }, [siteKey, containerRefToUse])

    useEffect(() => {
        if (!scriptReady || !siteKey) return
        const t = setTimeout(renderWidget, 0)
        return () => {
            clearTimeout(t)
            if (typeof window !== 'undefined' && window.grecaptcha && widgetIdRef.current !== null) {
                try {
                    window.grecaptcha.reset(widgetIdRef.current)
                } catch (_) {}
                widgetIdRef.current = null
            }
            setIsReady(false)
        }
    }, [scriptReady, siteKey, renderWidget])

    const getToken = useCallback(() => {
        if (!siteKey) return Promise.resolve(null)
        if (!window.grecaptcha || widgetIdRef.current === null) {
            return Promise.reject(new Error('reCAPTCHA not ready'))
        }
        return new Promise((resolve, reject) => {
            resolveRef.current = resolve
            rejectRef.current = reject
            try {
                window.grecaptcha.execute(widgetIdRef.current)
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
        recaptchaContainerRef: containerRefToUse
    }
}

export default useRecaptcha
