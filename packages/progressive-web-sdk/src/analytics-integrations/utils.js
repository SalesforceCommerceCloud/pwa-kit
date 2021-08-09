/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * The `utils` module contains general utility functions used by Analytics
 * Integrations.
 * @module progressive-web-sdk/dist/analytics-integrations/utils
 */

/**
 * Loads a script asynchronously and resolves a promise when it has loaded.
 * This is only for use in a browser environment.
 *
 * @param src
 * @return {Promise}
 */
export const loadScript = (src) => {
    const existingScript = document.querySelectorAll(`script[src="${src}"]`)[0]
    const script = existingScript || document.createElement('script')

    // Don't download script again if it's already downloaded or is downloading.
    // Script may not be finished downloading because it is done async.
    if (existingScript && script.loaded) return Promise.resolve()

    return new Promise((resolve, reject) => {
        const onLoad = () => {
            if (!existingScript) console.log(`Analytics: Success loading script ${src}`)
            script.loaded = true
            script.removeEventListener('load', onLoad)
            script.removeEventListener('error', onError)
            resolve()
        }

        const onError = () => {
            if (!existingScript) console.error(`Analytics: Error loading script ${src}`)
            script.removeEventListener('load', onLoad)
            script.removeEventListener('error', onError)
            reject()
        }

        script.addEventListener('load', onLoad)
        script.addEventListener('error', onError)

        if (!existingScript) {
            script.src = src
            script.loaded = false

            const firstScript = document.getElementsByTagName('script')[0]
            firstScript.parentNode.insertBefore(script, firstScript)
        }
    })
}
