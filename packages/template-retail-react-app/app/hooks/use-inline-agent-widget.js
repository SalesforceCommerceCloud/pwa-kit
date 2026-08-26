/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useRef, useState} from 'react'

const isConfigured = (config) => {
    return !!(config?.scrt2Url && config?.orgId && config?.esDeveloperName)
}

const loadScript = () => {
    return new Promise((resolve, reject) => {
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
        script.onerror = (e) => reject(e)
        document.head.appendChild(script)
    })
}

const useInlineAgentWidget = (config) => {
    const [ready, setReady] = useState(false)
    const containerRef = useRef(null)

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (!config?.enabled || !isConfigured(config)) return
        loadScript().then(() => setReady(true))
    }, [config])

    useEffect(() => {
        if (!config?.enabled || !ready) return
        if (!containerRef.current) return
        if (containerRef.current.querySelector('inline-agent-widget')) return

        const el = document.createElement('inline-agent-widget')
        el.setAttribute('scrt2-url', config.scrt2Url)
        el.setAttribute('org-id', config.orgId)
        el.setAttribute('es-developer-name', config.esDeveloperName)
        el.setAttribute('capabilities-version', config.capabilitiesVersion)
        if (config.placeholder) el.setAttribute('placeholder', config.placeholder)

        containerRef.current.appendChild(el)

        return () => {
            el.remove()
        }
    }, [ready, config])

    return containerRef
}

export default useInlineAgentWidget
