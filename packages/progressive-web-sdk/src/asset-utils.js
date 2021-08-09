/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// This is set on the preview loader script element by the
// preview script. See portal/templates/preview/preview.js
// in portal_all
export const PREVIEW_SCRIPT_ID = 'mobify-preview-loader'

// the V8 tag sets this as the non-preview loader script id. See
// https://github.com/mobify/portal_app/blob/master/portal/templates/core/tag_8.html
export const LOADER_SCRIPT_ID = 'mobify-v8-tag'

// Helper method to get the directory name of the given script element's src
// attribute. We expect only external script elements to be provided as argument
// and with an absolute src path
export const getScriptOrigin = (scriptEl) => {
    const src = scriptEl && scriptEl.getAttribute('src')

    // This regular expression replaces the last found '/' and anything following
    // with a '/', i.e.:
    // 'http://www.mobify.com/hello-world.js' -> 'http://www.mobify.com/'
    const match = src && src.replace(/\/[^/]*$/, '/')

    if (!match) {
        console.error(
            "Couldn't determine build file used. The mobify-tag may be placed incorrectly."
        ) // eslint-disable-line max-len
    }

    return match
}

/**
 * Only build the origin once, because getBuildOrigin takes script
 * in an reversed order, if any external script is appended,
 * the origin will be wrong and the assets will be loaded with wrong URL
 */
let origin

export const clearOrigin = () => {
    origin = null
}

/**
 * Get all the loader.js or adaptive.js script on the page
 */
export const getMobifyScript = () => {
    // Get all the scripts on the page...
    const scripts = Array.prototype.slice
        .call(document.getElementsByTagName('script'), 0)
        // ...eliminate any that have no src...
        .filter((script) => script.src)
        // ....in reverse order
        .reverse()

    const script =
        /*
         * Note: If you modify the script search criteria, please update the
         *       Error that is thrown immediately below when the search fails.
         */
        // Look for the mobify-preview-loader by id (set by the preview script)
        scripts.filter((script) => script.id === PREVIEW_SCRIPT_ID)[0] ||
        // Look for the main loader by id (set by the tag)
        scripts.filter((script) => script.id === LOADER_SCRIPT_ID)[0] ||
        // Look for a loader.js or adaptive.min.js loaded from a Mobify domain
        scripts.filter((script) => /mobify.+\/(loader|adaptive)(\.min)?\.js/.test(script.src))[0] ||
        // **Special transitional case** - For v7 tags loading preview bundles
        // that already support the v8 tag. In this case none of the loader.js
        // scripts will have an `id` and may not have come from *.mobify.*
        // origins (ie. when previewing on a device against a development bundle
        // served off of your machine: https://192.168.0.52:8443 for example).
        // In this case we'll just load the first loader/adaptive script we find
        // remembering that we've sorted the scripts in reverse order (which
        // should guarantee we get the preview <script> and not the production
        // one)
        scripts.filter(
            (script) =>
                window.Mobify &&
                window.Mobify.tagVersion &&
                window.Mobify.tagVersion[0] === 7 &&
                /\/(loader|adaptive)(\.min)?\.js/.test(script.src)
        )[0]
    return script
}

/**
 *  Grabs the location of the build so we can reference assets
 *  with absolute urls
 */
export const getBuildOrigin = () => {
    // IMPORTANT! Don't use functions that require polyfills here
    // This function is used to load the polyfills so it will fail
    // if it contains ES6 functions,loader.js will error out and the
    // desktop site will be shown instead

    if (origin) {
        return origin
    }

    if (window.Progressive && window.Progressive.buildOrigin) {
        origin = window.Progressive.buildOrigin
        return origin
    }

    // Look for the loader.js script to get its origin. In production,
    // there will be one loader.js. In preview mode, there will be two,
    // and one will have its id set to PREVIEW_SCRIPT_ID. If we find
    // that preview loader, we use its origin. Otherwise we use the
    // origin of the production loader.js, looking it up using an id
    // that the tag sets.
    // For backwards compatibility, if we don't find a loader.js
    // that has a known id set, we will use the LAST loader.js/adaptive.min.js
    // script (loaded from a Mobify domain) that we find on the page.
    // This mimics the previous behaviour of this function.
    const script = getMobifyScript()

    if (script) {
        origin = getScriptOrigin(script)
        return origin
    }

    // If we haven't found a candidate loader script at this point, we will
    // return a default build origin. This isn't optimal (we should probably
    // throw), but this is used in many places and so we'd need to thoroughly
    // test throwing before rolling it out.
    console.warn(
        "getBuildOrigin() could not find a valid 'loader.js' <script> " +
            'in the document! There must be at least one <script> element in this ' +
            'document that match one of the following criteria (searched for in ' +
            'this order):\n' +
            `\t* 'id' === '${PREVIEW_SCRIPT_ID}'\n` +
            `\t* 'id' === '${LOADER_SCRIPT_ID}'\n` +
            `\t* 'src' contains 'mobify' and either 'loader.js' or 'adaptive.js'\n` +
            `\t* the tag is a v7 tag and 'src' contains 'loader.js' or 'adaptive.js'\n`
    )
    console.warn(`getBuildOrigin() using default origin: ${script}`)

    return '//0.0.0.0:8443/'
}

// Expected to be overridden by initCacheManifest
let cacheHashManifest = {
    hashes: {},
    buildDate: Date.now()
}

/**
 * Expects object of the form shown above by cacheHashManifest
 * provided by scripts/create-hash-manifest.js run in a project
 */
export const initCacheManifest = (externalManifest) => {
    cacheHashManifest = externalManifest || {hashes: {}}
}

/**
 *  Returns the full url for the provided asset path
 *  including a cache breaker.
 *  basePath and cacheBreaker arguments are optional
 */
export const getAssetUrl = (path, baseUrl, cacheBreaker) => {
    if (cacheBreaker === undefined) {
        const hash = cacheHashManifest.hashes[path]
        cacheBreaker = hash || cacheHashManifest.buildDate
    }

    const origin = baseUrl || getBuildOrigin()
    if (cacheBreaker !== undefined) {
        return `${origin}${path}?${cacheBreaker}`
    }
    return `${origin}${path}`
}

/**
 *  Dynamically adds an element to the page based on the nodeName
 *  and options supplied
 *
 *  ex: loadAsset('link', {
 *          href: 'css/stylesheet.css',
 *          rel: 'stylesheet',
 *          type: 'text/css'
 *      })
 */
export const loadAsset = (nodeName, options) => {
    const firstScript = document.getElementsByTagName('script')[0]

    const script = document.createElement(nodeName)
    Object.keys(options).forEach((prop) => {
        script.setAttribute(prop, options[prop])
    })
    firstScript.parentNode.insertBefore(script, firstScript)
}
