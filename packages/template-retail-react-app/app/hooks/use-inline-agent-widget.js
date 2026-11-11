/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useRef, useState} from 'react'
import {DEFAULT_EMBEDDED_AGENT_CAPABILITIES_VERSION} from '@salesforce/retail-react-app/app/constants'
import {resolveEmbeddedWidgetSourceUrl} from '@salesforce/retail-react-app/app/utils/inline-agent-widget-utils'

let readyPromise = null

const ensureWidget = (scriptSourceUrl) => {
    if (readyPromise) return readyPromise

    if (customElements.get('inline-agent-widget')) {
        readyPromise = Promise.resolve()
        return readyPromise
    }

    const existing = document.querySelector(`script[src="${scriptSourceUrl}"]`)
    const script = existing || document.createElement('script')
    readyPromise = new Promise((resolve, reject) => {
        const onError = () => {
            script.remove()
            readyPromise = null
            reject(new Error('Inline agent widget CDN script failed to load'))
        }
        script.addEventListener('error', onError, {once: true})
        customElements.whenDefined('inline-agent-widget').then(() => {
            script.removeEventListener('error', onError)
            resolve()
        })
    })
    if (!existing) {
        script.src = scriptSourceUrl
        script.async = true
        document.head.appendChild(script)
    }

    return readyPromise
}

const isConfigured = (config) => {
    if (!config?.enabled) return false
    // shopper-agent never opens a SCRT2 session — only `enabled` matters.
    if (config?.mode === 'shopper-agent') return true
    return Boolean(config?.scrt2Url && config?.orgId && config?.esDeveloperName)
}

// Stable string key for the pdpQuestions array so the sync effect's dependency
// is by value, not identity. An empty/undefined list serializes to "" so it
// compares equal across renders and doesn't churn.
const pdpQuestionsKey = (pdpQuestions) =>
    Array.isArray(pdpQuestions) && pdpQuestions.length > 0 ? JSON.stringify(pdpQuestions) : ''

const useInlineAgentWidget = (config, {pdpQuestions, productName} = {}) => {
    const [ready, setReady] = useState(false)
    const containerRef = useRef(null)
    const configured = isConfigured(config)
    const questionsKey = pdpQuestionsKey(pdpQuestions)
    const mode = config?.mode
    const scriptSourceUrl = resolveEmbeddedWidgetSourceUrl(config)

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (!configured) return
        let cancelled = false
        ensureWidget(scriptSourceUrl)
            .then(() => {
                if (!cancelled) setReady(true)
            })
            .catch((error) => {
                if (!cancelled) console.error(error.message)
            })
        return () => {
            cancelled = true
        }
    }, [configured, scriptSourceUrl])

    useEffect(() => {
        if (!configured || !ready) return
        if (!containerRef.current) return
        if (containerRef.current.querySelector('inline-agent-widget')) return

        const el = document.createElement('inline-agent-widget')
        if (mode) el.setAttribute('mode', mode)
        // SCRT2 fields are only set when they're real — shopper-agent mode
        // doesn't need them and the UMD's config-validation skips the check
        // when `mode="shopper-agent"`.
        if (config.scrt2Url) el.setAttribute('scrt2-url', config.scrt2Url)
        if (config.orgId) el.setAttribute('org-id', config.orgId)
        if (config.esDeveloperName) el.setAttribute('es-developer-name', config.esDeveloperName)
        el.setAttribute('capabilities-version', DEFAULT_EMBEDDED_AGENT_CAPABILITIES_VERSION)
        if (config.placeholder) el.setAttribute('placeholder', config.placeholder)
        if (config.persistSession !== false) el.setAttribute('persist-session', '')
        if (config.enableLogging) el.setAttribute('enable-logging', '')
        if (config.preWarm !== false) el.setAttribute('pre-warm', '')
        // Seed pdp-questions at create time when we already have them, so the
        // pills paint in the same frame the widget mounts (no visible pop-in
        // from the attribute-sync effect below).
        if (questionsKey) el.setAttribute('pdp-questions', questionsKey)
        // Seed product-name at create time so the InputBar placeholder reads
        // "Ask me anything about <productName>" from first paint. The sync
        // effect below handles variant switches / SPA PDP navigation without
        // tearing down the widget.
        if (productName) el.setAttribute('product-name', productName)

        containerRef.current.appendChild(el)

        return () => {
            el.remove()
        }
    }, [configured, ready, config, mode])

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

    return containerRef
}

export {isConfigured}
export default useInlineAgentWidget
