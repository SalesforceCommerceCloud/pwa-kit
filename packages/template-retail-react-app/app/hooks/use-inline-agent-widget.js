/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useRef, useState} from 'react'

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

const useInlineAgentWidget = (config) => {
    const [ready, setReady] = useState(false)
    const containerRef = useRef(null)
    const configured = isConfigured(config)

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
        if (config.placeholder) el.setAttribute('placeholder', config.placeholder)
        if (config.persistSession !== false) el.setAttribute('persist-session', '')
        if (config.enableLogging) el.setAttribute('enable-logging', '')

        containerRef.current.appendChild(el)

        return () => {
            el.remove()
        }
    }, [configured, ready, config])

    return containerRef
}

export {isConfigured}
export default useInlineAgentWidget
