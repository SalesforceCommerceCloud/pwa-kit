/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/*
 Utilities for the SSR Loader. The utilities in this file are, in general,
 NOT intended to be used in any other part of the SDK.

 Before importing this module, the caller should apply whatever polyfills
 are required for the target browser set. Then loadUPWA must be called,
 passing the required options.
 */

import {getAssetUrl, getBuildOrigin, initCacheManifest, loadAsset} from '../asset-utils'
import {
    createGlobalMessagingClientInitPromise,
    loadAndInitMessagingClient
} from '../utils/messaging'
import {
    setPerformanceValues,
    trackFirstPaints,
    trackTTI,
    triggerSandyAppStartEvent,
    PLATFORMS
} from '../utils/loader-utils/performance-timing'
import {loadWorker} from '../utils/loader-utils/service-worker-setup'
import {loaderLog, setLoaderDebug} from '../utils/loader-utils/loader-logging'
import {loadScript, browserSupportsMessaging} from '../utils/utils'

let DEBUG = false
export const debugLog = (...args) => {
    if (DEBUG) {
        console.log('[ssr-loader]', ...args)
    }
}

/**
 * Load the PWA. Must be called with the required options (in an object)
 * from the project's ssr-loader.js file.
 * @function
 * @param {Object} options
 * @param {String} [options.messagingSiteId] - If supplied, messaging is
 * enabled (assuming the browser supports it) and the given string is the
 * messaging site_id.
 * @param {String} options.mobifyPropertyId - The project's property id
 * (previously called the 'projectSlug').
 * @param {Boolean} [options.debug=false] - true to enable some debug
 * logging, falsy if no debug output should be enabled.
 * @param {Object} [overrides] - allows override (mocking) of the functions
 * called by loadUPWA, for testing. Mocking out imported functions is
 * problematic: the overrides object allows us to do it selectively.
 */
export const loadUPWA = ({debug, messagingSiteId, mobifyPropertyId, overrides}) => {
    DEBUG = !!debug
    if (DEBUG) {
        setLoaderDebug(true)
        loaderLog(`Build origin is '${getBuildOrigin()}'`)
    }

    debugLog(`loadUPWA for project ${mobifyPropertyId}`)

    const messagingEnabled = !!messagingSiteId
    if (!mobifyPropertyId) {
        throw new Error('mobifyPropertyId must be defined')
    }

    const windowProgressive = window.Progressive
    if (!windowProgressive) {
        throw new Error('window.Progressive is not defined')
    }
    // istanbul ignore next
    const ssrOptions = windowProgressive.ssrOptions || {}

    // Apply overrides
    const deps = Object.assign(
        {
            browserSupportsMessaging,
            createGlobalMessagingClientInitPromise,
            getAssetUrl,
            initCacheManifest,
            loadAndInitMessagingClient,
            loadAsset,
            loadScript,
            loadWorker,
            setPerformanceValues,
            trackFirstPaints,
            trackTTI,
            triggerSandyAppStartEvent
        },
        overrides
    )

    // Track First Paint and First Contentful Paint for PWA and non-PWA
    debugLog('trackFirstPaints')
    deps.trackFirstPaints()

    // Configure window.Progressive fully
    debugLog('setPerformanceValues')
    deps.setPerformanceValues()
    Object.assign(windowProgressive, {
        AstroPromise: Promise.resolve({}),
        Messaging: {
            enabled: messagingEnabled
        },
        // resolve this with an undefined value to make the
        // client load the original page (i.e., there is no
        // captured text).
        capturedDocHTMLPromise: Promise.resolve()
    })

    // Create a fake cacheManifest that will be compatible with
    // loader assumptions, but work for SSR.
    const cacheHashManifest = {
        hashes: {},
        buildDate: ssrOptions.bundleId || 0
    }
    deps.initCacheManifest(cacheHashManifest)

    try {
        deps.trackTTI()
    } catch (e) {
        // istanbul ignore next
        if (typeof console !== 'undefined') {
            console.error(e.message)
        }
    }

    // An Array of Promises kicked off by this function. A Promise.all()
    // is returned at the end so that test code can wait on completion.
    const promises = []

    // Service worker loading
    // istanbul ignore else
    if ('serviceWorker' in navigator) {
        debugLog('Loading service worker')
        promises.push(
            deps
                .loadWorker(true, messagingEnabled, cacheHashManifest, true)
                // When the service worker load has started, initialize messaging
                // if required.
                .then(() => {
                    debugLog('Service worker loaded and ready')
                    if (messagingEnabled) {
                        // Whether this browser is capable of supporting Messaging
                        if (deps.browserSupportsMessaging()) {
                            // We need to create window.Mobify.WebPush.PWAClient
                            // at this point. If a project is configured to use
                            // non-progressive Messaging, it will load the
                            // webpush-client-loader, which will then detect that
                            // window.Mobify.WebPush.PWAClient exists and do nothing.
                            window.Mobify = window.Mobify || {}
                            window.Mobify.WebPush = window.Mobify.WebPush || {}
                            window.Mobify.WebPush.PWAClient = {}

                            // We know we're not running in Astro, that the service worker is
                            // supported and loaded, and messaging is enabled and supported,
                            // so we can load and initialize the Messaging client.
                            deps.loadAndInitMessagingClient(debug, messagingSiteId, true)
                        }
                    }
                })
        )
    }

    // Create the Promise that Messaging waits on. We always create this
    // even in a browser that doesn't support messaging, so that code
    // can rely on it being present.
    deps.createGlobalMessagingClientInitPromise(messagingEnabled)

    // Schedule Sandy setup
    debugLog('Triggering AppStartEvent')
    deps.triggerSandyAppStartEvent(true, mobifyPropertyId, PLATFORMS.UPWA)

    // Load the stylesheet if we have been requested to do so. In some cases
    // the SSR Server may have rendered a <link> in the page that will load
    // it.
    if (ssrOptions.loadStylesheet) {
        debugLog('Loading stylesheet')
        deps.loadAsset('link', {
            id: 'progressive-web-main-stylesheet',
            href: deps.getAssetUrl(ssrOptions.stylesheetFilename || 'main.css'),
            rel: 'stylesheet',
            type: 'text/css',
            // Tell us when the stylesheet has loaded so we know when it's safe to
            // remove our inline styles
            onload: `var inlineStyles = document.getElementById('x-inline-styles');
            inlineStyles && inlineStyles.parentNode.removeChild(inlineStyles);`
        })
    }

    const scriptsToLoad = ssrOptions.ssrLoaderScripts
    if (scriptsToLoad && scriptsToLoad.length) {
        scriptsToLoad.forEach((path, index) => {
            debugLog(`Loading ${path} as script ${index}`)
            deps.loadScript({
                id: `progressive-web-script-${index}`,
                src: getAssetUrl(path)
            })
        })
    }

    const vendorName = ssrOptions.vendorFilename || 'vendor.js'
    debugLog(`Loading ${vendorName}`)
    deps.loadScript({
        id: 'progressive-web-vendor',
        src: deps.getAssetUrl(vendorName)
    })

    const mainName = ssrOptions.mainFilename || 'main.js'
    debugLog(`Loading ${mainName}`)
    deps.loadScript({
        id: 'progressive-web-main',
        src: deps.getAssetUrl(mainName)
    })

    return Promise.all(promises).then(() => debugLog('loadUPWA complete'))
}
