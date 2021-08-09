/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/**
 * loadScriptCounter is used as a key to the window.Mobify object handlers. We
 * Want this outside the loadScript function so that it can be updated every
 * loadScript is called with a new script to be embedded to the head tag.
 * @private
 */
let loadScriptCounter = 0

/**
 * Writes script tag to the document, head tag
 * @function
 * @param {string} id - The id for script
 * @param {string} src - The path to script
 * @param {boolean} isAsync=true - Writes an asynchronous function
 * @param {boolean} docwrite=false - Writes a string of text to a document
 * @param {function} onload - The onload callback function
 * @param {boolean} onerror - Rejects the function
 * @example
 * import {loadScript} from 'pwa-kit-react-sdk/dist/utils/utils'
 *
 * loadScript({
 *     id: 'loadScriptTest1',
 *     src: 'loadScriptTest1src'
 * })
 */
export const loadScript = ({id, src, isAsync = true, docwrite = false, onload, onerror}) => {
    const hasTriedLoadScript = ({id, src, method}) => {
        const idQuery = id ? `[id="${id}"]` : ''
        return (
            document.querySelectorAll(
                `script${idQuery}` + `[src="${src}"]` + `[data-load-method="${method}"]`
            ).length > 0
        )
    }

    const loadMethod = docwrite ? 'document.write()' : 'DOM'

    if (hasTriedLoadScript({id, src, method: loadMethod})) {
        console.warn(
            `[mobify.progressive] loadScript() already called for this script. Ignoring call. (method='${loadMethod}' id='${id}' src='${src}')`
        )
        return
    }

    if (onload && typeof onload !== 'function') {
        throw new Error(
            `loadScript()'s 'onload' parameter must be a function but was passed a ${typeof onload}!`
        )
    }

    if (onerror && typeof onerror !== 'function') {
        throw new Error(
            `loadScript()'s 'onerror' parameter must be a function but was passed a ${typeof onerror}!`
        )
    }

    // TODO: Check for navigator.connection. Need Android for this.
    /* istanbul ignore next */
    if (docwrite && document.readyState === 'loading') {
        window.Mobify = window.Mobify || {}

        let onLoadString = ''
        let onErrorString = ''

        if (typeof onload === 'function') {
            window.Mobify.scriptOnLoads = Object.assign({}, window.Mobify.scriptOnLoads, {
                [loadScriptCounter]: onload
            })
            // Space prefix is important for valid rendered HTML
            onLoadString = ` onload="window.Mobify.scriptOnLoads['${loadScriptCounter}'] && window.Mobify.scriptOnLoads['${loadScriptCounter}']()"`
        }

        if (typeof onerror === 'function') {
            window.Mobify.scriptOnErrors = Object.assign({}, window.Mobify.scriptOnErrors, {
                [loadScriptCounter]: onerror
            })
            // Space prefix is important for valid rendered HTML
            onErrorString = ` onerror="window.Mobify.scriptOnErrors['${loadScriptCounter}'] && window.Mobify.scriptOnErrors['${loadScriptCounter}']()"`
        }

        document.write(
            `<script id='${id}' src='${src}' data-load-method='${loadMethod}' charset='utf-8'${onLoadString}${onErrorString}></script>`
        )
        loadScriptCounter++
    } else {
        const script = document.createElement('script')

        // Setting UTF-8 as our encoding ensures that certain strings (i.e.
        // Japanese text) are not improperly converted to something else. We
        // do this on the vendor scripts also just in case any libs we
        // import have localized strings in them.
        script.charset = 'utf-8'
        script.async = isAsync
        if (id) {
            script.id = id
        }
        script.src = src
        script.dataset.loadMethod = loadMethod

        /* istanbul ignore next */
        if (typeof onload === 'function') {
            script.onload = onload
        }
        /* istanbul ignore next */
        if (typeof onerror === 'function') {
            script.onerror = onerror
        }

        document.getElementsByTagName('head')[0].appendChild(script)
    }
}
