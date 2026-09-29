/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useRef, useState} from 'react'
import {DEFAULT_COMMERCE_CLIENT_CAPABILITIES_VERSION} from '@salesforce/retail-react-app/app/constants'

const SCRIPT_SRC = '/static/inline-agent-widget.umd.js'

let readyPromise = null

const ensureWidget = () => {
    if (readyPromise) return readyPromise

    if (customElements.get('inline-agent-widget')) {
        readyPromise = Promise.resolve()
        return readyPromise
    }

    // Ensure the script tag exists in <head> (Helmet adds it on SSR, but on
    // client-only navigation we may need to inject it manually).
    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
        const script = document.createElement('script')
        script.src = SCRIPT_SRC
        script.async = true
        document.head.appendChild(script)
    }

    // Wait for the custom element to be registered — works regardless of
    // whether the script was included in SSR HTML or injected dynamically.
    readyPromise = customElements.whenDefined('inline-agent-widget').then(() => {
        if (!customElements.get('inline-agent-widget') && window.InlineAgentWidget?.defineElement) {
            window.InlineAgentWidget.defineElement()
        }
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

const useInlineAgentWidget = (config, {pdpQuestions} = {}) => {
    const [ready, setReady] = useState(false)
    const containerRef = useRef(null)
    const configured = isConfigured(config)
    const questionsKey = pdpQuestionsKey(pdpQuestions)

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (!configured) return
        let cancelled = false
        ensureWidget().then(() => {
            if (!cancelled) setReady(true)
        })
        return () => {
            cancelled = true
        }
    }, [configured])

    useEffect(() => {
        if (!configured || !ready) return
        if (!containerRef.current) return
        if (containerRef.current.querySelector('inline-agent-widget')) return

        const el = document.createElement('inline-agent-widget')
        el.setAttribute('scrt2-url', config.scrt2Url)
        el.setAttribute('org-id', config.orgId)
        el.setAttribute('es-developer-name', config.esDeveloperName)
        el.setAttribute('capabilities-version', DEFAULT_COMMERCE_CLIENT_CAPABILITIES_VERSION)
        if (config.placeholder) el.setAttribute('placeholder', config.placeholder)
        if (config.persistSession !== false) el.setAttribute('persist-session', '')
        if (config.enableLogging) el.setAttribute('enable-logging', '')
        // Seed pdp-questions at create time when we already have them, so the
        // pills paint in the same frame the widget mounts (no visible pop-in
        // from the attribute-sync effect below).
        if (questionsKey) el.setAttribute('pdp-questions', questionsKey)

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

    return containerRef
}

export {isConfigured}
export default useInlineAgentWidget
