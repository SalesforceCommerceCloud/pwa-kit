/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {getSSRTimer, isUniversal} from './utils/ssr-shared-utils'
import getJQueryHtml from './get-jquery-html'

// The timeout (which can be adjusted by tests)
let waitTimeoutmS = 10000

// For tests
export const setWaitTimeout = (timeout) => {
    const existing = waitTimeoutmS
    waitTimeoutmS = timeout
    return existing
}

/**
 * Given a condition checking function, returns a Promise that resolves
 * when either the condition checking function returns true or when
 * waitTimeoutmS have passed.
 *
 * @private
 * @param {function} condition
 * @returns {Promise<*>}
 */
export const waitForCondition = (condition) => {
    // If the condition is true now, return a resolved Promise (this is
    // likely to be the most common path, so it's optimized)
    if (condition()) {
        return Promise.resolve()
    }

    // Return a Promise will resolve when the condition becomes true
    // or we timeout.
    return new Promise((resolve, reject) => {
        const intervalStart = Date.now()

        // Function that checks condition at intervals
        const checker = () => {
            if (Date.now() - intervalStart > waitTimeoutmS) {
                reject(condition) // report back which condition was rejected
            }

            if (condition()) {
                resolve()
            } else {
                setTimeout(checker, 50)
            }
        }

        // Queue the next check
        setTimeout(checker, 50)
    })
}

export const capturingIsLoaded = () => {
    return typeof window.Capture !== 'undefined'
}

export const jQueryIsLoaded = () => {
    const mobifyJqueryLoaded = typeof window.Progressive.$ !== 'undefined'
    const otherJqueryLoaded = typeof window.$ !== 'undefined'

    return mobifyJqueryLoaded || otherJqueryLoaded
}

/**
 * Returns a promise that resolves when all required dependencies
 * are available. Depending on the project configuration,
 * dependencies may include `Capture` and `jQuery`.
 * @private
 * @returns {Promise<*>}
 */
export const waitForDependencies = () => {
    // For a PWA, we wait until capturingIsLoaded and jQueryIsLoaded
    // are true. For a UPWA, we must check the ssrOptions and wait only
    // on the modules that were loaded.
    const universal = isUniversal()
    const waitConditions = []

    if (universal) {
        const ssrOptions = (window.Progressive && window.Progressive.ssrOptions) || {}

        if (ssrOptions.loadCaptureJS && !capturingIsLoaded()) {
            waitConditions.push(capturingIsLoaded)
        }

        if (ssrOptions.loadJQuery && !jQueryIsLoaded()) {
            waitConditions.push(jQueryIsLoaded)
        }
    } else {
        waitConditions.push(capturingIsLoaded, jQueryIsLoaded)
    }

    return Promise.all(waitConditions.map((cond) => waitForCondition(cond))).catch((condition) => {
        let errorMessage = `From within a jqueryResponse ' +
                'promise, the ${condition.name}() function timed out.`

        /* istanbul ignore next */
        if (condition.name === 'capturingIsLoaded') {
            errorMessage += ' This means capturing did not load'
        }

        /* istanbul ignore next */
        if (condition.name === 'jQueryIsLoaded') {
            errorMessage += ' This means jQuery did not load'
        }

        throw new Error(errorMessage)
    })
}

/**
 * We use this variable to reference getJQueryHtml, so that it's
 * possible for test code to mock it even though this module
 * includes it directly. When running Jest tests, spying on
 * a method in a nested module is extremely challenging.
 * @private
 */
let getter = getJQueryHtml

/**
 * For testing, allows replacement of the getJQueryHtml 'getter'
 * @private
 */
export const setGetter = (newGetter) => {
    getter = newGetter
}

/**
 * Convert an HTMLDocument into an HTMLHtmlElement object
 * @private
 * @param {object HTMLDocument} - As from `new DOMParser().parseFromString('<div>example</div>', 'text/html')`
 * @return {object HTMLHtmlElement}
 */
const getHtmlElement = (doc) => {
    // DESKTOP-460: To support IE 11, we use doc.childNodes. We
    // fallback to doc.children only just incase childNodes is not
    // present in some random browser.
    const children = doc.childNodes || /* istanbul ignore next */ doc.children

    // Filter out the children so we only get the HTMLHtmlElement.
    // Some browsers return more than one child, but our code
    // expects just one child. This ensures the functionality is
    // consistent with jQuery when used via `getJQueryHtml`, which
    // also strips out comments
    return Array.from(children).find((node) => {
        return node.toString().includes('HTMLHtmlElement')
    })
}

/**
 * Takes a response (or the text of a response) and returns the
 * text with all resources disabled (i.e. scripts, links, etc.).
 * This uses Capture under the hood.
 * @private
 * @param {Response|String} response
 * @returns {Promise<String>} – Resolves when the response text is
 * returned
 */
const getEscapedResponseText = function(response) {
    // If the response object has a 'text' method, then
    // we assume it's a Response. We avoid an instanceof because
    // it's not straightforward to use the correct Response class
    // both server-side (node-fetch) and client-side.
    const text = response.text ? response.text() : Promise.resolve(response)
    return (
        text
            // So long as Capture is available, disable all resources
            // (scripts, links, etc.) so they do not download before
            // we want them to. So a `<script src="foo.js" />` will
            // be changed to `<script x-src="foo.js" />`, thus the
            // script will not load until we re-enable the resource.
            .then(
                (responseText) =>
                    (window.Capture && window.Capture.disable(responseText, 'x-')) || responseText
            )
    )
}

/**
 * jqueryResponse takes an HTML response and parses it,
 * returning a reference to a selector library that can be
 * used to query it, and a JQuery-wrapped HTML document.
 *
 * For convenience, this function can be passed either a
 * Response object (on which text() will immediately be
 * called) or a String (which should be the result of
 * calling text() on a Response).
 *
 * @param {Response|String} response
 * @returns {*}
 */
export const jqueryResponse = function(response) {
    const timer = getSSRTimer()
    const operationId = timer && timer.operationId
    const timerName = operationId ? `jqueryResponse${operationId}` : null
    timerName && timer.start(timerName)

    // Use a named function here to make timing visible in Chrome DevTools
    const parseText = function(escapedText) {
        const selectorLibrary = window.Progressive.$ || window.$
        let jqueryObject

        // DESKTOP-437
        // The SDK implementation of getJQueryHtml is slow
        // and has potential side-effects. If we're running in a UPWA,
        // we can rely on a given version of JQuery that allows us to
        // use a faster implementation.
        // If the browser supports DOMParser, then we can use that to turn the
        // text into a Document - this is significantly faster than
        // getJQueryHtml. However, to maintain backwards compatibility, we
        // only do that for a UPWA.
        if (isUniversal() && 'DOMParser' in window) {
            const parserTimerName = operationId ? `parseFromString${operationId}` : null
            parserTimerName && timer.start(parserTimerName)
            const parser = new DOMParser()
            const doc = parser.parseFromString(escapedText, 'text/html')

            // If the parsing process fails, the DOMParser does not throw
            // an exception, but instead returns an error document
            // (https://developer.mozilla.org/en-US/docs/Web/API/DOMParser)
            // We detect that here and only continue if the document
            // is okay.
            if (!doc.getElementsByTagName('parsererror').length) {
                // 'doc' is a Document element, but we want the HTML elements
                // that are its children. If there are multiple children this
                // will reduce them to a single root element.
                const htmlElement = getHtmlElement(doc)

                // We need to return a jqueryObject that is (or mimics) an
                // HTMLCollection, containing a single root HTMLHtmlElement
                // for the entire document.
                jqueryObject = selectorLibrary(htmlElement)
            }

            parserTimerName && timer.end(parserTimerName)
        }

        // If we're not in a UPWA, or DOMParser isn't available, or
        // the parsing failed, fall back to the original implementation.
        if (!jqueryObject) {
            jqueryObject = getter(selectorLibrary, escapedText)
        }

        timerName && timer.end(timerName)

        return [selectorLibrary, jqueryObject]
    }

    return waitForDependencies()
        .then(() => response)
        .then(getEscapedResponseText)
        .then(parseText)
}
