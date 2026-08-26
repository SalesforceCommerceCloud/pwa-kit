/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useRef} from 'react'
import useScript from '@salesforce/retail-react-app/app/hooks/use-script'

const useInlineAgentWidget = (config) => {
    const scriptLoadStatus = useScript('/static/inline-agent-widget.umd.js')
    const containerRef = useRef(null)

    useEffect(() => {
        if (!scriptLoadStatus.loaded || scriptLoadStatus.error) return
        if (!containerRef.current) return
        if (containerRef.current.querySelector('inline-agent-widget')) return

        const el = document.createElement('inline-agent-widget')
        el.setAttribute('scrt2-url', config.scrt2Url)
        el.setAttribute('org-id', config.orgId)
        el.setAttribute('es-developer-name', config.esDeveloperName)
        el.setAttribute('capabilities-version', config.capabilitiesVersion)
        if (config.placeholder) el.setAttribute('placeholder', config.placeholder)
        el.setAttribute('persist-session', '')

        containerRef.current.appendChild(el)

        return () => {
            el.remove()
        }
    }, [scriptLoadStatus, config])

    return containerRef
}

export default useInlineAgentWidget
