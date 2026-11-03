/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState} from 'react'
import PropTypes from 'prop-types'

/**
 * Custom hook to handle script loading
 * @param {string} src - The source URL for the script
 * @returns {Object} The script load status
 */
const useScript = (src) => {
    const [scriptLoadStatus, setScriptLoadStatus] = useState({
        src: null,
        loaded: false,
        error: false
    })
    // Effect to load and initialize the script
    useEffect(() => {
        if (!src) {
            return
        }

        let script = document.querySelector(`script[src="${src}"]`)
        const isNew = !script
        if (isNew) {
            script = document.createElement('script')
            script.src = src
            script.defer = true
        }

        // Keep status on the shared tag so remounts can reuse a completed load.
        // These tag listeners remain active even while there are no consumers.
        const statusAttribute = 'data-script-status'
        if (!script.hasAttribute(statusAttribute)) {
            script.setAttribute(statusAttribute, 'loading')
            script.addEventListener('load', () => script.setAttribute(statusAttribute, 'ready'), {
                once: true
            })
            script.addEventListener('error', () => script.setAttribute(statusAttribute, 'error'), {
                once: true
            })
        }
        const updateStatus = () => {
            const status = script.getAttribute(statusAttribute)
            setScriptLoadStatus({src, loaded: status === 'ready', error: status === 'error'})
        }
        script.addEventListener('load', updateStatus)
        script.addEventListener('error', updateStatus)
        updateStatus()
        if (isNew) document.body.appendChild(script)

        return () => {
            script.removeEventListener('load', updateStatus)
            script.removeEventListener('error', updateStatus)
        }
    }, [src])

    // A changed URL cannot inherit the preceding script's ready state during render.
    return src && scriptLoadStatus.src === src
        ? {loaded: scriptLoadStatus.loaded, error: scriptLoadStatus.error}
        : {loaded: false, error: false}
}

useScript.propTypes = {
    src: PropTypes.string
}

export default useScript
