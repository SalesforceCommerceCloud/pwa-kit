/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useRef, useState} from 'react'

let scriptPromise = null

const loadScript = () => {
    if (scriptPromise) return scriptPromise
    scriptPromise = new Promise((resolve, reject) => {
        if (customElements.get('inline-agent-widget')) {
            resolve()
            return
        }
        const script = document.createElement('script')
        script.src = '/static/inline-agent-widget.umd.js'
        script.onload = () => {
            if (
                !customElements.get('inline-agent-widget') &&
                window.InlineAgentWidget?.defineElement
            ) {
                window.InlineAgentWidget.defineElement()
            }
            resolve()
        }
        script.onerror = (e) => {
            scriptPromise = null
            reject(e)
        }
        document.head.appendChild(script)
    })
    return scriptPromise
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
        loadScript().then(() => setReady(true))
    }, [enabled, scrt2Url, orgId, esDeveloperName])

    useEffect(() => {
        if (!enabled || !ready) return
        if (!containerRef.current) return
        if (containerRef.current.querySelector('inline-agent-widget')) return

        const el = document.createElement('inline-agent-widget')
        el.setAttribute('scrt2-url', scrt2Url)
        el.setAttribute('org-id', orgId)
        el.setAttribute('es-developer-name', esDeveloperName)
        el.setAttribute('capabilities-version', capabilitiesVersion)
        if (placeholder) el.setAttribute('placeholder', placeholder)
        el.setAttribute('product-id-pattern', '/product/([^/?#]+)')

        containerRef.current.appendChild(el)

        return () => {
            el.remove()
        }
    }, [ready, enabled, scrt2Url, orgId, esDeveloperName, capabilitiesVersion, placeholder])

    return containerRef
}

export default useInlineAgentWidget
