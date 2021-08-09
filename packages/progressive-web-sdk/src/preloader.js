/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

const META_CONTENT = 'width=device-width'

// Omit the preloader from the document created by capturing
// This way, if we need to unmobify the page at a later point
// The preloader won't be rerendered with the rest of the captured document
export const PRELOADER_CLASSES = 'preload-remove capture-remove'

export const displayPreloader = (preloadCss, preloadHtml, preloadJs) => {
    let head = document.getElementsByTagName('head')
    let body = document.getElementsByTagName('body')

    // Some older browsers throw exceptions if document.head/document.body doesn't exist
    /* istanbul ignore if */
    if (!head.length || !body.length) {
        return
    }

    head = head[0]
    body = body[0]

    const style = document.createElement('style')
    const container = document.createElement('div')
    const scriptEl = document.createElement('script')
    const meta = document.createElement('meta')

    meta.name = 'viewport'
    meta.content = META_CONTENT

    style.className = PRELOADER_CLASSES
    container.className = `preloader ${PRELOADER_CLASSES}`
    scriptEl.className = PRELOADER_CLASSES

    style.innerHTML = preloadCss
    container.innerHTML = preloadHtml
    scriptEl.innerHTML = preloadJs

    head.appendChild(meta)
    head.appendChild(style)

    body.appendChild(container)
    head.appendChild(scriptEl)
}

export const hidePreloader = () => {
    const elements = document.getElementsByClassName(PRELOADER_CLASSES)

    Array.prototype.slice.call(elements).forEach((el) => {
        el.remove()
    })

    // Remove the initial viewport meta tag from the document. It'll be re-added
    // by the PWA or UPWA
    const metaTag = document.querySelector(`meta[content="${META_CONTENT}"]`)
    if (metaTag) {
        document.querySelector(`meta[content="${META_CONTENT}"]`).remove()
    }
}
