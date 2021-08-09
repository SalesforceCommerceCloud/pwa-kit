/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/**
 * @module progressive-web-sdk/dist/utils/utils
 */
// This file contains functions used by the app 'loader.js'. It should be kept
// as small as possible to reduce the size of the loader.

/* istanbul ignore next */
export function noop() {} // eslint-disable-line func-style

/**
 * Converts a URL to the relative URL
 * @function
 * @param {string} url - the url to be converted (if it's already relative it will be returned as is)
 * @param {bool} includeHash=false - indicates if the URL hash should be included in the relative URL returns
 * @param {bool} includeQuery=true - indicates if the URL query should be included in the relative URL returns
 * @returns {String}
 * @example
 * import {extractPathFromURL} from 'progressive-web-sdk/dist/utils/utils'
 *
 * extractPathFromURL('http://www.mobify.com/test')
 * // /test
 *
 * extractPathFromURL('https://localhost:8443/test?id=5#lower', true)
 * // /test?id=5#lower
 *
 * extractPathFromURL('https://localhost:8443/test?id=5#lower', false)
 * // /test?id=5
 *
 * extractPathFromURL('https://localhost:8443/test?id=5#lower', false, false)
 * // /test
 *
 */
export const extractPathFromURL = (url, includeHash = false, includeQuery = true) => {
    let workingUrl = url

    if (/^\//.test(workingUrl)) {
        // URL is relative, make it a full URL so we can use the same
        // logic below to rebuild the path.
        workingUrl = `http://www.example.com${workingUrl}`
    }

    const urlObject = new URL(workingUrl)

    return `${urlObject.pathname}${includeQuery ? urlObject.search : ''}${
        includeHash ? urlObject.hash : ''
    }`
}

/**
 * Converts a full URL to the preferred format for keying the redux store,
 * i.e. the path and query string
 * @function
 * @param {string} url - The url to be converted
 * @returns {String}
 * @example
 * import {urlToPathKey} from 'progressive-web-sdk/dist/utils/utils'
 *
 * urlToPathKey('http://www.mobify.com/test')
 * // /test
 */
export const urlToPathKey = (url) => extractPathFromURL(url, false)

/**
 * Converts a full URL to the preferred format for keying the redux store,
 * i.e. only the path (without query string)
 * @function
 * @param {string} url - The url to be converted
 * @returns {String}
 * @example
 * import {urlToBasicPathKey} from 'progressive-web-sdk/dist/utils/utils'
 *
 * urlToBasicPathKey('http://www.mobify.com/test')
 * // /test
 */
export const urlToBasicPathKey = (url) => extractPathFromURL(url, false, false)

/**
 * Get the major version of Chrome and return it as an integer.
 * If the browser isn't Chrome, return zero.
 * @function
 * @param {string} userAgent - the userAgent to test
 * @returns {Number}
 * @example
 * import {getChromeVersion} from 'progressive-web-sdk/dist/utils/utils'
 *
 * getChromeVersion('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36')
 * // 60
 */
export const getChromeVersion = (userAgent) => {
    const versionMatch = userAgent.match(/(Chrome|CriOS)\/(\d+)/i)
    const version = versionMatch && parseInt(versionMatch[2])
    return version || 0
}

/**
 * Check if Chrome version is 68 or higher. Non-Chrome browsers will always
 * return `false`.
 * @function
 * @param {string} userAgent - the userAgent to test
 * @returns {Boolean}
 * @example
 * import {getChromeVersion} from 'progressive-web-sdk/dist/utils/utils'
 *
 * isChrome68OrHigher('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36')
 * // 60
 */
export const isChrome68OrHigher = (userAgent) => {
    const version = getChromeVersion(userAgent)
    return !!version && version >= 68
}

/**
 * Checks if the user is on Samsung Browser
 * @function
 * @param {string} userAgent - the userAgent to test
 * @returns {Boolean}
 * @example
 * import {isSamsungBrowser} from 'progressive-web-sdk/dist/utils/utils'
 *
 * isSamsungBrowser('Mozilla/5.0 ... SamsungBrowser')
 * // true
 */
export const isSamsungBrowser = (userAgent) => {
    const samsungRegex = /SamsungBrowser/i

    const chromeVersion = getChromeVersion(userAgent)

    // Some older Samsung devices have a default browser that's stuck on an old version of Chrome
    // We want to default to the responsive site for these devices
    // We know for sure that Chrome 28 doesn't work so we're using that as the cutoff for now
    const unsupportedChrome = chromeVersion && chromeVersion <= 28

    // Page speed insights uses a chrome 27 user agent, so we need to explicitly support it
    const isPageSpeed = /Google Page Speed Insights/i.test(userAgent)

    return !isPageSpeed && (samsungRegex.test(userAgent) || unsupportedChrome)
}

/**
 * Return true if the given useragent is of a browser running on iOS.
 * We do this to allow detection of all iOS/webkit browsers in one test.
 * @function
 * @param {string} userAgent - the userAgent to test
 * @returns {Boolean}
 * @example
 * import {iOSBrowser} from 'progressive-web-sdk/dist/utils/utils'
 *
 * iOSBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1')
 * // true
 */
export const iOSBrowser = (userAgent) => /(iPad|iPhone|iPod)/g.test(userAgent)

/**
 * Return true if the given useragent is of a browser running on Android.
 * @function
 * @param {string} userAgent - the userAgent to test
 * @returns {Boolean}
 * @example
 * import {isAndroidBrowser} from 'progressive-web-sdk/dist/utils/utils'
 *
 * isAndroidBrowser('Mozilla/5.0 (Linux; Android 4.0.4; Galaxy Nexus Build/IMM76B) AppleWebKit/535.19 (KHTML, like Gecko) Chrome/18.0.1025.133 Mobile Safari/535.19')
 * // true
 */
export const isAndroidBrowser = (userAgent) => /(Android|Nexus)/g.test(userAgent)

/**
 * Checks if the user is on Samsung Browser
 * @function
 * @param {string} userAgent - the userAgent to test
 * @returns {Boolean}
 * @example
 * import {isFirefoxBrowser} from 'progressive-web-sdk/dist/utils/utils'
 *
 * isFirefoxBrowser('Mozilla/5.0 ... Firefox')
 * // true
 */
export const isFirefoxBrowser = (userAgent) => {
    const firefoxRegex = /Firefox/i
    const iOSFirefoxRegex = /FxiOS/i

    return firefoxRegex.test(userAgent) || iOSFirefoxRegex.test(userAgent)
}

/**
 * Get the major version of Firefox. If the browser isn't Firefox, then
 * return zero
 * @function
 * @param {string} userAgent - the userAgent to test
 * @returns {Number}
 * @example
 * import {getFirefoxVersion} from 'progressive-web-sdk/dist/utils/utils'
 *
 * getFirefoxVersion('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:54.0) Gecko/20100101 Firefox/54.0')
 * // 54
 */
export const getFirefoxVersion = (userAgent) => {
    const versionMatch = userAgent.match(/(Firefox|FxiOS)\/(\d+)/i)
    const version = versionMatch && parseInt(versionMatch[2])
    return version || 0
}

/**
 * Inserts a `<plaintext>` tag to document, it gets written immediately after
 * the Mobify tag.
 * @function
 * @example
 * import {preventDesktopSiteFromRendering} from 'progressive-web-sdk/dist/utils/utils'
 *
 * preventDesktopSiteFromRendering()
 */
export const preventDesktopSiteFromRendering = () => {
    if (document.querySelectorAll('plaintext').length > 0) {
        // If the plaintext tag is already present in the page, this means that
        // the desktop site has already been prevented from rendering. This
        // is due to the use of an older Mobify tag (pre V8), which inserts
        // the plaintext tag inline.
        return
    }
    document.write('<plaintext style="display: none;">')
}

/**
 * loadScriptCounter is used as a key to the window.Mobify object handlers. We
 * Want this outside the loadScript function so that it can be updated every
 * loadScript is called with a new script to be embedded to the head tag.
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
 * import {loadScript} from 'progressive-web-sdk/dist/utils/utils'
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

/**
 * Instantiates a promise to write a script tag to the document head tag. The
 * promise is resolved by the script's `onload` callback.
 * @function
 * @param {string} id - The id for script
 * @param {string} src - The path to script
 * @param {function} onload - The onload callback function
 * @param {boolean} isAsync=true - Writes an asynchronous function
 * @param {boolean} rejectOnError=true - Rejects the function on error
 * @param {boolean} docwrite=false - Writes a string of text to a document
 * @example
 * import {loadScriptAsPromise} from 'progressive-web-sdk/dist/utils/utils'
 *
 * loadScriptAsPromise({
 *     id: 'loadScriptTest1',
 *     src: 'loadScriptTest1src'
 * })
 */
export const loadScriptAsPromise = ({
    id,
    src,
    onload,
    isAsync = true,
    rejectOnError = true,
    docwrite = false
}) =>
    new Promise((resolve, reject) => {
        const resolver = () => {
            /* istanbul ignore else */
            if (typeof onload === 'function') {
                onload()
            }
            resolve()
        }

        loadScript({
            id,
            src,
            onload: resolver,
            isAsync,
            docwrite,
            onerror: rejectOnError ? reject : /* istanbul ignore next */ resolve
        })
    })

/**
 * The purpose of this function is that when user is on a slow WiFi connections
 * and unable to load page via document.write.
 * @function
 * @returns {Boolean}
 * @example
 * import {documentWriteSupported} from 'progressive-web-sdk/dist/utils/utils'
 *
 * documentWriteSupported()
 * // true
 */
export const documentWriteSupported = () => {
    // The downlink speed table on the W3C Network Information API
    // has the max downlink for 2.75G as 0.384
    // As downlinkMax is not always defined we want multiple ways
    // to detect if the user is on a slow 2G connection
    // https://developers.google.com/web/updates/2016/08/removing-document-write
    // https://wicg.github.io/netinfo/

    if (
        navigator.connection &&
        (navigator.connection.downlink <= 0.38 ||
            navigator.connection.downlinkMax <= 0.44 ||
            navigator.connection.effectiveType === '2g' ||
            navigator.connection.effectiveType === 'slow-2g')
    ) {
        return false
    }
    return true
}

/**
 * Verify if page number is valid
 * If valid, return page number
 * If not valid, return first or last page number
 * @function
 * @param {number} page - input page parameter to be verified
 * @param {number} count=false - optional parameter indicate total page count
 * @returns {Number}
 * @example
 * import {validatePageNumber} from 'progressive-web-sdk/dist/utils/utils'
 *
 * validatePageNumber(100, 10) // 10
 *
 * validatePageNumber(-6) // 1
 */
export const validatePageNumber = (page, count = false) => {
    page = parseInt(page)
    if (isNaN(page) || page < 1) {
        return 1
    }
    if (count && page > count) {
        return count
    }
    return page
}

/**
 * Checks if the given storage type is available.
 * @function
 * @param {Storage} storage
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Storage
 * @returns {Boolean}
 * @example
 * import {isStorageAvailable} from 'progressive-web-sdk/dist/utils/utils'
 */
const isStorageAvailable = (storage) => {
    const x = '__test_key__'
    try {
        storage.setItem(x, x)

        // Test retrieving the set item
        if (x !== storage.getItem(x)) {
            throw new Error(`${typeof storage} is not supported in this environment!`)
        }

        return true
    } catch (e) {
        return false
    } finally {
        try {
            storage.removeItem(x)
        } catch (e) {
            /* Swallow errors here */
        }
    }
}

/**
 * Checks if local storage is available in the current environment.
 * @function
 * @returns {Boolean}
 * @example
 * import {isLocalStorageAvailable} from 'progressive-web-sdk/dist/utils/utils'
 *
 * isLocalStorageAvailable()
 * // true
 */
export const isLocalStorageAvailable = () => {
    return isStorageAvailable(localStorage)
}

/**
 * Checks if session storage is available in the current environment.
 * @function
 * @returns {Boolean}
 * @example
 * import {isSessionStorageAvailable} from 'progressive-web-sdk/dist/utils/utils'
 *
 * isSessionStorageAvailable()
 * // true
 */
export const isSessionStorageAvailable = () => {
    return isStorageAvailable(sessionStorage)
}

/**
 * Checks if the browser supports Messaging - specifically, whether it supports
 * Mobify messaging, rather than W3C push notifications in general. Not all
 * browsers that support push are supported by Mobify, since the support for
 * the standards has evolved over time, and some older browsers have quirks
 * that mean we consider them unsupported.
 *
 * This function is Messaging-specific, but it's provided here in this SDK
 * file so that it's usable by the loader, without requiring the loader to
 * import yet another SDK module.
 *
 * This function will work for a PWA and also in non-PWA (standalone) mode,
 * so it will report true for browsers other than Chrome.
 *
 * The checks here are a combination of browser capability checks and version
 * checks for specific browsers. The minimum versions of browsers should align
 * with the supported browser version in the Messaging server file
 * https://github.com/mobify/pusheen/blob/master/backend/config.py
 *
 * This function does not check for Safari APNS push messaging support.
 * @function
 * @param {boolean} userAgent - the userAgent to test - used for testing
 * @returns {Boolean}
 * @example
 * import {browserSupportsMessaging} from 'progressive-web-sdk/dist/utils/utils'
 *
 * browserSupportsMessaging('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:54.0) Gecko/20100101 Firefox/54.0')
 * // true
 **/
export const browserSupportsMessaging = (userAgent) => {
    // Browser capability checks
    if (
        !// W3C Push Messaging (https://www.w3.org/TR/push-api/)
        // requires that the browser support service workers. Much
        // of the Push API is only available to service workers, and
        // this function is intended to work client-side, so we can't
        // check for full availability. However, if there's no
        // service worker support, there can be no Push API.
        (
            navigator.serviceWorker &&
            // If Notification isn't present, we can't
            // check for or request permission to show notifications.
            window.Notification
        )
    ) {
        return false
    }

    // The browser supports service workers and the Notification
    // interface. However, the API has evolved over time, and support
    // is not always consistent across browsers, so we need to check
    // the browser name and minimum version. The minimum version numbers
    // here must match values in the Messaging backend (backend/config.js)
    const ua = userAgent || navigator.userAgent

    // Exclude all iOS webkit browsers. As of iOS 10, they will also fail
    // the service-worker/Notification test above, but here we're guarding
    // against those features appearing in iOS before we have time to test
    // Messaging support.
    if (iOSBrowser(ua)) {
        return false
    }

    // Check for Chrome
    let version = getChromeVersion(ua)
    if (version && version >= 46) {
        return true
    }

    // Check for Firefox
    version = getFirefoxVersion(ua)
    if (version && version >= 46) {
        return true
    }

    // This is not a browser that we explicitly support, so
    // the safest return is false.
    return false
}

/**
 * This util is designed for use only when the app first launches in standalone mode.
 * The window.matchMedia check may fail on some versions of chrome even
 * if the app is in standalone mode and after the app launches and the user has
 * navigated elsewhere the URL may not contain ?homescreen=1 anymore.
 *
 * Using this util outside of when the app launches may produce false negatives
 *
 * If you need to check if the app is in standalone mode use the key stored
 * in the app branch of the redux store instead of this util.
 * @function
 * @returns {Boolean}
 * @example
 * import {isStandalone} from 'progressive-web-sdk/dist/utils/utils'
 *
 * isStandalone()
 * // true
 */
export const isStandalone = () =>
    /homescreen=1/.test(window.location.href) ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)

/**
 * For code that doesn't have access to the store, this function provides
 * a defined way to check whether code is running server-side or not.
 *
 * This is named runningServerSide rather than isServerSide to avoid
 * it being confused with the isServerSide selector.
 * @function
 * @returns {*|boolean} - true if running server-side, false if not
 */
export const runningServerSide = () =>
    typeof window !== 'undefined' && window.Progressive && window.Progressive.isServerSide

/**
 * Returns `true` if the current user agent suggest it is a web crawler.
 * @function
 * @returns {Boolean}
 * @example
 * import {isCrawler} from 'progressive-web-sdk/dist/utils/utils'
 *
 * isCrawler()
 * // true
 */
export const isCrawler = () =>
    /bot|googlebot|crawler|spider|robot|crawling/i.test(window.navigator.userAgent)

/**
 * Build a query string
 * @function
 * @param {string} query - the query string
 * @returns {String}
 * @example
 * import {buildQueryString} from 'progressive-web-sdk/dist/utils/utils'
 *
 * buildQueryString('?n=John&n=Susan') // ?q=?n=John&n=Susan
 */

export const buildQueryString = (query) => {
    return `?q=${query.replace(/ /g, '+')}`
}

/**
 * Transform full name into an object
 * @function
 * @param {String} fullname - First and last name
 * @returns {Object}
 * @example
 * import {splitFullName} from 'progressive-web-sdk/dist/utils/utils'
 *
 * splitFullName(`John Smith`)
 * // {firstname: 'John', lastname: 'Smith'}
 */
export const splitFullName = (fullname) => {
    if (!fullname) {
        return {}
    }
    let names = fullname.trim().split(' ')

    // filter out any empty strings
    names = names.filter((name) => name)

    return {
        firstname: names.slice(0, 1).join(' '),
        lastname: names.slice(1).join(' ')
    }
}

/**
 * Get the document cookie value, it's based on regex courtesy of
 * https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie.
 * @function
 * @param {string} cookieName - the value of cookie name
 * @example
 * import {getCookieValue} from 'progressive-web-sdk/dist/utils/utils'
 *
 * const cookieValue = 'World'
 * document.cookie = `test2=${cookieValue}`
 * getCookieValue('test2') // World
 */

export const getCookieValue = (cookieName) => {
    const result = document.cookie.replace(
        new RegExp(`(?:(?:^|.*;\\s*)${cookieName}\\s*\\=\\s*([^;]*).*$)|^.*$`),
        '$1'
    )
    return result
}

/**
 * Returns a path given a `location` object.
 * @function
 * @param {object} object - a location object from React Router
 * @property {string} object.pathname - the path name
 * @property {string} object.search - the search query
 * @returns {String} - the `path` and `search` concatenated together
 * @example
 * import {getPath} from 'progressive-web-sdk/dist/utils/utils'
 *
 * const object = {
 *     pathname: 'product',
 *     search: '?post=1234&action=edit'
 * }
 * getPath(object) // product?post=1234&action=edit
 */

export const getPath = ({pathname, search}) => pathname + search

/**
 * Returns a full URL given a `location` object.
 * @function
 * @param {object} location - a location object from React Router
 * @returns {String} - the full URL for the given location
 * @example
 * // window.location.origin = https://www.mobify.com/
 *
 * import {getURL} from 'progressive-web-sdk/dist/utils/utils'
 *
 * const pathName = 'product'
 * const searchQuery = '?post=1234&action=edit'
 * const object = {
 *     pathname: pathName,
 *     search: searchQuery
 * }
 * getURL(object) // https://www.mobify.com/product?post=1234&action=edit
 */

export const getURL = (location) => window.location.origin + getPath(location)

/**
 * Wraps an action creator function so that the React synthetic action
 * is not passed in. This is necessary to avoid spurious warnings from
 * the React code.
 * @function
 * @param {function} fn - an action creator function
 * @returns {Function} - the wrapped action creator
 * @example
 * import {stripEvent} from 'progressive-web-sdk/dist/utils/utils'
 */

export const stripEvent = (fn) =>
    /* istanbul ignore next */
    () => fn()

/**
 * Writes a link element to the document. The link element includes charset,
 * href and rel attributes. "charset" attribute is set with "utf-8", "rel"
 * attribute is set with "prefetch", and you set "href" with object param with
 * href property.
 * @function
 * @param {object} object
 * @property {string} object.href - the href path
 * @example
 * import {prefetchLink} from 'progressive-web-sdk/dist/utils/messaging'
 *
 * prefetchLink({href: 'path'})
 */

export const prefetchLink = ({href, callback, errorback}) => {
    const link = document.createElement('link')

    // Setting UTF-8 as our encoding ensures that certain strings (i.e.
    // Japanese text) are not improperly converted to something else. We
    // do this on the vendor scripts also just in case any libs we
    // import have localized strings in them.
    link.charset = 'utf-8'
    link.href = href
    link.rel = 'prefetch'
    /* istanbul ignore next */
    if (callback) {
        link.onload = callback
    }
    /* istanbul ignore next */
    if (errorback) {
        link.onerror = errorback
    }

    document.getElementsByTagName('head')[0].appendChild(link)
}

/**
 * Indicate is the URL passed in is a Data URL URI scheme.
 * @function
 * @param {string} url - the url to be tested
 * @returns {bool} - indicates if the URL is a data URL
 * @example
 * import {isDataURL} from 'progressive-web-sdk/dist/utils/utils'
 *
 * isDataURL('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')
 */

export const isDataURL = (url) =>
    url && !!url.match(/^data:([\w/+]+);(charset=[\w-]+|base64).*,([a-zA-Z0-9+/]+={0,2})/)
