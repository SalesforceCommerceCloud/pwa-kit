/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

export const markup = '<html><head></head><body></body></html>'
export const errorString = 'First argument to getJQueryHtml must be a selector library like jQuery.'

export const makeDocument = (responseHTML) => {
    responseHTML = responseHTML || markup

    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.appendChild(iframe)

    const doc = iframe.contentDocument
    doc.open()
    doc.write(responseHTML)
    doc.close()

    setTimeout(() => {
        iframe.remove()
    }, 0)

    return doc
}

/**
 * This creates a fake HTML document, then adds the string given to it as the
 * content, or defaults to the simple markup above. The HTML element is then
 * wrapped in the provided selector library and returned.
 * Adapted from: https://github.com/mobify/adaptivejs/blob/master/lib/documentFactory.js
 *
 * @param {function} selectorLibrary - a selector library like jQuery
 * @param {string} responseHTML - the response HTML from the server
 * @returns {object} a jQuery-wrapped document object
 */
const getJQueryHtml = (selectorLibrary, responseHTML) => {
    if (typeof selectorLibrary !== 'function') {
        throw new Error(errorString)
    }

    return selectorLibrary(makeDocument(responseHTML).documentElement)
}

export default getJQueryHtml
