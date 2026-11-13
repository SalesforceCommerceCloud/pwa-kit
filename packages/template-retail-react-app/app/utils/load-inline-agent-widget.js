/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

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
        let settled = false
        const finish = (error) => {
            if (settled) return
            settled = true
            clearTimeout(timer)
            script.removeEventListener('error', onError)
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
            () => finish(new Error('Inline agent widget CDN script registration timed out')),
            10000
        )
        script.addEventListener('error', onError, {once: true})
        customElements.whenDefined('inline-agent-widget').then(() => finish(), finish)
    })
    if (!existing) {
        script.src = scriptSourceUrl
        script.async = true
        // Match Helmet's attributes so it retains the listener-bound script.
        script.setAttribute('async', 'true')
        script.setAttribute('data-react-helmet', 'true')
        document.head.appendChild(script)
    }

    return readyPromise
}

export default ensureWidget
