/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useRef, useState} from 'react'
import {DEFAULT_EMBEDDED_AGENT_CAPABILITIES_VERSION} from '@salesforce/retail-react-app/app/constants'

const SCRIPT_SRC = '/static/inline-agent-widget.umd.js'

let readyPromise = null

const ensureWidget = () => {
    if (readyPromise) return readyPromise

    if (customElements.get('inline-agent-widget')) {
        readyPromise = Promise.resolve()
        return readyPromise
    }

    readyPromise = new Promise((resolve, reject) => {
        let script = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
        const injected = !script
        if (injected) {
            script = document.createElement('script')
            script.src = SCRIPT_SRC
            script.async = true
        }
        let settled = false
        const finish = (error) => {
            if (settled) return
            settled = true
            clearTimeout(timeout)
            script.removeEventListener('load', onLoad)
            script.removeEventListener('error', onError)
            if (error) {
                script.remove()
                reject(error)
            } else {
                resolve()
            }
        }
        const onLoad = () => {
            try {
                if (
                    !customElements.get('inline-agent-widget') &&
                    window.InlineAgentWidget?.defineElement
                ) {
                    window.InlineAgentWidget.defineElement()
                }
                if (customElements.get('inline-agent-widget')) finish()
            } catch (error) {
                finish(error)
            }
        }
        const onError = () => finish(new Error('Inline agent widget script failed to load'))
        const timeout = setTimeout(
            () => finish(new Error('Inline agent widget registration timed out')),
            15000
        )
        script.addEventListener('load', onLoad)
        script.addEventListener('error', onError)
        customElements.whenDefined('inline-agent-widget').then(() => finish())
        if (injected) document.head.appendChild(script)
    }).catch((error) => {
        readyPromise = null
        throw error
    })
    return readyPromise
}

const isConfigured = (config) =>
    Boolean(config?.enabled && config?.scrt2Url && config?.orgId && config?.esDeveloperName)

// Stable string key for the pdpQuestions array so the sync effect's dependency
// is by value, not identity. An empty/undefined list serializes to "" so it
// compares equal across renders and doesn't churn.
const pdpQuestionsKey = (pdpQuestions) =>
    Array.isArray(pdpQuestions) && pdpQuestions.length > 0 ? JSON.stringify(pdpQuestions) : ''

const useInlineAgentWidget = (
    config,
    {pdpQuestions, productName, cartContext, title, description, uiText} = {}
) => {
    const [ready, setReady] = useState(false)
    const [loadError, setLoadError] = useState(false)
    const [attempt, setAttempt] = useState(0)
    const containerRef = useRef(null)
    const configured = isConfigured(config)
    const questionsKey = pdpQuestionsKey(pdpQuestions)
    const cartContextKey = cartContext ? JSON.stringify(cartContext) : ''
    const uiTextKey = uiText ? JSON.stringify(uiText) : ''

    useEffect(() => {
        if (typeof window === 'undefined') return
        setReady(false)
        setLoadError(false)
        if (!configured) return
        let cancelled = false
        ensureWidget()
            .then(() => {
                if (!cancelled) setReady(true)
            })
            .catch(() => {
                if (!cancelled) setLoadError(true)
            })
        return () => {
            cancelled = true
        }
    }, [configured, attempt])

    useEffect(() => {
        if (!configured || !ready) return
        if (!containerRef.current) return
        if (containerRef.current.querySelector('inline-agent-widget')) return

        const el = document.createElement('inline-agent-widget')
        el.setAttribute('scrt2-url', config.scrt2Url)
        el.setAttribute('org-id', config.orgId)
        el.setAttribute('es-developer-name', config.esDeveloperName)
        el.setAttribute('capabilities-version', DEFAULT_EMBEDDED_AGENT_CAPABILITIES_VERSION)
        if (config.placeholder) el.setAttribute('placeholder', config.placeholder)
        if (!cartContextKey && config.persistSession !== false)
            el.setAttribute('persist-session', '')
        if (config.enableLogging) el.setAttribute('enable-logging', '')
        // Seed pdp-questions at create time when we already have them, so the
        // pills paint in the same frame the widget mounts (no visible pop-in
        // from the attribute-sync effect below).
        if (questionsKey) el.setAttribute('pdp-questions', questionsKey)
        // Seed product-name at create time so the InputBar placeholder reads
        // "Ask me anything about <productName>" from first paint. The sync
        // effect below handles variant switches / SPA PDP navigation without
        // tearing down the widget.
        if (productName) el.setAttribute('product-name', productName)
        if (cartContextKey) {
            el.setAttribute('cart-mode', '')
            el.setAttribute('cart-context', cartContextKey)
        }
        if (title) el.setAttribute('title', title)
        if (description) el.setAttribute('description', description)
        if (uiTextKey) el.setAttribute('ui-text', uiTextKey)

        containerRef.current.appendChild(el)

        return () => {
            el.remove()
        }
    }, [configured, ready, config])

    // Keep the pdp-questions attribute in sync with the current product. Runs
    // separately from element creation so a variant switch / SPA nav to a new
    // PDP updates the pills without tearing down the widget (which would drop
    // the SCRT2 session).
    useEffect(() => {
        if (!configured || !ready) return
        if (!containerRef.current) return
        const el = containerRef.current.querySelector('inline-agent-widget')
        if (!el) return
        if (questionsKey) {
            el.setAttribute('pdp-questions', questionsKey)
        } else {
            el.removeAttribute('pdp-questions')
        }
    }, [configured, ready, questionsKey])

    // Keep the product-name attribute in sync. Same rationale as pdp-questions
    // above: variant switch / SPA PDP nav re-templates the InputBar
    // placeholder without a widget teardown. Removing the attribute when the
    // name is absent lets the widget fall back to the generic placeholder.
    useEffect(() => {
        if (!configured || !ready) return
        if (!containerRef.current) return
        const el = containerRef.current.querySelector('inline-agent-widget')
        if (!el) return
        if (productName) {
            el.setAttribute('product-name', productName)
        } else {
            el.removeAttribute('product-name')
        }
    }, [configured, ready, productName])

    useEffect(() => {
        if (!configured || !ready) return
        const el = containerRef.current?.querySelector('inline-agent-widget')
        if (!el) return
        if (cartContextKey) {
            el.setAttribute('cart-mode', '')
            el.setAttribute('cart-context', cartContextKey)
            el.removeAttribute('persist-session')
        } else {
            el.removeAttribute('cart-mode')
            el.removeAttribute('cart-context')
        }
        for (const [name, value] of [
            ['title', title],
            ['description', description]
        ]) {
            if (value) el.setAttribute(name, value)
            else el.removeAttribute(name)
        }
    }, [configured, ready, cartContextKey, title, description])

    useEffect(() => {
        if (!configured || !ready) return
        const el = containerRef.current?.querySelector('inline-agent-widget')
        if (!el) return
        if (uiTextKey) el.setAttribute('ui-text', uiTextKey)
        else el.removeAttribute('ui-text')
    }, [configured, ready, uiTextKey])

    const retry = () => setAttempt((value) => value + 1)
    return {containerRef, loadError, retry}
}

export {isConfigured}
export default useInlineAgentWidget
