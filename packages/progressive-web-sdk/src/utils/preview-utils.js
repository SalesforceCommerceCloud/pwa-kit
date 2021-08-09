/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/preview-utils
 */
import {loadScript} from './utils'
const PREVIEW_URL = 'https://preview.mobify.com/v7/'

/**
 * Gets the value of a specific cookie
 * @function
 * @param {string} name - The name of a cookie
 * @returns {String}
 * @example
 * import {getCookie} from 'progressive-web-sdk/dist/utils/preview-utils'
 *
 * document.cookie = 'testCookie=xyz'
 * getCookie('testCookie')
 * // xyz
 */
export const getCookie = (name) => {
    // Internet Explorer treats empty cookies differently, it does
    // not include the '=', so our regex has to be extra complicated.
    const re = new RegExp(`(?:^|; )${name}(?:(?:=([^;]*))|(?:; |$))`)
    const match = document.cookie.match(re)
    return (match && match[1]) || ''
}

/**
 * Checks if the user is in preview mode
 * @function
 * @returns {Boolean}
 * @example
 * import {isPreview} from 'progressive-web-sdk/dist/utils/preview-utils'
 *
 * isPreview()
 * // true
 */
export const isPreview = () => {
    return getCookie('mobify-path') === 'true' || /mobify-path=true/.test(window.location.hash)
}

/**
 * Checks if the loader has been loaded via a V8+ tag, the version 8 of the
 * Mobify Tag.
 * @function
 * @returns {Boolean}
 * @example
 * import {isV8Tag} from 'progressive-web-sdk/dist/utils/preview-utils'
 *
 * isV8Tag()
 * // true
 */
export const isV8Tag = () => {
    if (window.Mobify.tagVersion && window.Mobify.tagVersion[0] === 8) {
        return true
    }
    return false
}

/**
 * The script path to the preview URL
 * @constant
 * @type {string}
 * @example
 * import {SHOULD_PREVIEW_QUERY} from 'progressive-web-sdk/dist/utils/preview-utils'
 *
 */
export const SHOULD_PREVIEW_QUERY = `script[src="${PREVIEW_URL}"]`

/**
 * This function is used to check whether the application should, or should not,
 * run preview. Because preview should only run once, if the application has
 * already done so then this function will return `false`.
 * @function
 * @returns {Boolean}
 * @example
 * import {shouldPreview} from 'progressive-web-sdk/dist/utils/preview-utils'
 *
 * shouldPreview()
 * // true
 */
export const shouldPreview = () => {
    // If the tag is not a V8 tag, then the tag itself will deal with previewing.
    if (!isV8Tag()) {
        return false
    }

    const previewHasRun = document.querySelectorAll(SHOULD_PREVIEW_QUERY).length > 0
    if (previewHasRun) {
        return false
    }

    return isPreview()
}

/**
 * Writes the preview script to the document
 * @function
 * @example
 * import {loadPreview} from 'progressive-web-sdk/dist/utils/preview-utils'
 *
 * loadPreview()
 * // true
 */
export const loadPreview = /* istanbul ignore next */ () => {
    /* istanbul ignore next */
    loadScript({
        src: PREVIEW_URL,
        docwrite: window.Mobify.shouldLoadPWA,
        isAsync: true
    })
}
