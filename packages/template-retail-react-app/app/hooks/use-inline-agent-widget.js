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
        if (
            !customElements.get('inline-agent-widget') &&
            window.InlineAgentWidget?.defineElement
        ) {
            window.InlineAgentWidget.defineElement()
        }
    })
    return readyPromise
}

const useInlineAgentWidget = (config) => {
    const [ready, setReady] = useState(false)
    const containerRef = useRef(null)
    const enabled = config?.enabled
    const scrt2Url = config?.scrt2Url
    const orgId = config?.orgId
    const esDeveloperName = config?.esDeveloperName
    const capabilitiesVersion = config?.capabilitiesVersion
    const placeholder = config?.placeholder

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (!enabled || !scrt2Url || !orgId || !esDeveloperName) return
        let cancelled = false
        ensureWidget().then(() => {
            if (!cancelled) setReady(true)
        })
        return () => {
            cancelled = true
        }
    }, [enabled, scrt2Url, orgId, esDeveloperName])

    useEffect(() => {
        if (!enabled || !ready || !scrt2Url || !orgId || !esDeveloperName) return
        if (!containerRef.current) return
        if (containerRef.current.querySelector('inline-agent-widget')) return

        const el = document.createElement('inline-agent-widget')
        el.setAttribute('scrt2-url', scrt2Url)
        el.setAttribute('org-id', orgId)
        el.setAttribute('es-developer-name', esDeveloperName)
        if (capabilitiesVersion) el.setAttribute('capabilities-version', capabilitiesVersion)
        if (placeholder) el.setAttribute('placeholder', placeholder)

        containerRef.current.appendChild(el)

        return () => {
            el.remove()
        }
    }, [ready, enabled, scrt2Url, orgId, esDeveloperName, capabilitiesVersion, placeholder])

    return containerRef
}

export default useInlineAgentWidget
