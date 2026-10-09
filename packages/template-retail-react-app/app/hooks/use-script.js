/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState} from 'react'
import PropTypes from 'prop-types'

const SCRIPT_STATUS_ATTR = 'data-script-status'

const applyStatusFromEvent = (script, eventType) => {
    const status = eventType === 'load' ? 'ready' : 'error'
    script.setAttribute(SCRIPT_STATUS_ATTR, status)
    return status
}

const subscribeToScript = (script, setScriptLoadStatus) => {
    const onScriptLoad = (event) => {
        const status = applyStatusFromEvent(script, event.type)
        setScriptLoadStatus({
            loaded: status === 'ready',
            error: status === 'error'
        })
    }

    script.addEventListener('load', onScriptLoad)
    script.addEventListener('error', onScriptLoad)

    return () => {
        script.removeEventListener('load', onScriptLoad)
        script.removeEventListener('error', onScriptLoad)
    }
}

/**
 * Custom hook to handle script loading
 * @param {string} src - The source URL for the script
 * @returns {Object} The script load status
 */
const useScript = (src) => {
    const [scriptLoadStatus, setScriptLoadStatus] = useState({loaded: false, error: false})
    // Effect to load and initialize the script
    useEffect(() => {
        if (!src) {
            return
        }

        const scriptAlreadyOnPage = document.querySelector(`script[src="${src}"]`)

        if (scriptAlreadyOnPage) {
            const existingStatus = scriptAlreadyOnPage.getAttribute(SCRIPT_STATUS_ATTR)
            if (existingStatus === 'ready') {
                setScriptLoadStatus({loaded: true, error: false})
                return
            }
            if (existingStatus === 'error') {
                setScriptLoadStatus({loaded: false, error: true})
                return
            }
            // Tag is in the DOM but still downloading — wait for load/error.
            return subscribeToScript(scriptAlreadyOnPage, setScriptLoadStatus)
        }

        const script = document.createElement('script')
        script.src = src
        script.defer = true
        document.body.appendChild(script)

        return subscribeToScript(script, setScriptLoadStatus)
    }, [src])

    return scriptLoadStatus
}

useScript.propTypes = {
    src: PropTypes.string
}

export default useScript
