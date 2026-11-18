/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

let readyPromise = null
let pendingScript = null

const ensureWidget = (scriptSourceUrl) => {
    if (readyPromise) {
        if (pendingScript && !pendingScript.isConnected) document.head.appendChild(pendingScript)
        return readyPromise
    }

    if (customElements.get('inline-agent-widget')) {
        readyPromise = Promise.resolve()
        return readyPromise
    }

    const existing = document.querySelector(`script[src="${scriptSourceUrl}"]`)
    const script = existing || document.createElement('script')
    pendingScript = script
    const attempt = new Promise((resolve, reject) => {
        let settled = false
        const finish = (error) => {
            if (settled) return
            settled = true
            clearTimeout(timer)
            script.removeEventListener('error', onError)
            pendingScript = null
            if (error) {
                readyPromise = null
                reject(error)
            } else {
                resolve()
            }
        }
        const onError = () => {
            script.remove()
            finish(new Error('Inline agent widget CDN script failed to load'))
        }
        const timer = setTimeout(
            () =>
                console.warn(
                    'Inline agent widget CDN script registration is taking longer than 10 seconds'
                ),
            10000
        )
        script.addEventListener('error', onError, {once: true})
        customElements.whenDefined('inline-agent-widget').then(() => finish(), finish)
    })
    readyPromise = attempt
    if (!existing) {
        script.src = scriptSourceUrl
        script.async = true
        document.head.appendChild(script)
    }

    return attempt
}

export default ensureWidget
