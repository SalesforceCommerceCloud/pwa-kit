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
    const [scriptLoadStatus, setScriptLoadStatus] = useState({loaded: false, error: false})
    // Effect to load and initialize the script
    useEffect(() => {
        if (!src) {
            return
        }

        // Check if script already exists
        const scriptAlreadyOnPage = document.querySelector(`script[src="${src}"]`)

        if (!scriptAlreadyOnPage) {
            const script = document.createElement('script')
            script.src = src
            script.defer = true
            document.body.appendChild(script)

            const onScriptLoad = (event) => {
                const loadStatus = event.type === 'load' ? 'ready' : 'error'
                setScriptLoadStatus({
                    loaded: loadStatus === 'ready',
                    error: loadStatus === 'error'
                })
            }

            script.addEventListener('load', onScriptLoad)
            script.addEventListener('error', onScriptLoad)
        }
    }, [src])

    return scriptLoadStatus
}

useScript.propTypes = {
    src: PropTypes.string
}

export default useScript
