/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {loaderLog} from './loader-logging'
import {isLocalStorageAvailable} from '../utils'
import {getBuildOrigin} from '../../asset-utils'

const MESSAGING_PWA_SW_VERSION_PATH =
    'https://webpush-cdn.mobify.net/pwa-serviceworker-version.json'
export const messagingSWVersionKey = 'messagingServiceWorkerVersion'
export const messagingSWUpdateKey = 'messagingSWVersionUpdate'

/**
 * Kick off a fetch for the service worker version, returning a Promise
 * that resolves when the fetch is done.
 * @private
 * @returns {*|Promise.<T>}
 */
export const updateMessagingSWVersion = () => {
    loaderLog(`Updating ${MESSAGING_PWA_SW_VERSION_PATH}`)
    return (
        fetch(MESSAGING_PWA_SW_VERSION_PATH)
            .then((response) => response.json())
            .then((versionData) => {
                // Persist the result in localStorage
                if (isLocalStorageAvailable()) {
                    if (versionData) {
                        /* istanbul ignore next */
                        localStorage.setItem(
                            messagingSWVersionKey,
                            `${versionData.SERVICE_WORKER_CURRENT_VERSION ||
                                ''}_${versionData.SERVICE_WORKER_CURRENT_HASH || ''}`
                        )
                    }

                    // Update the sessionStorage marker that tells us we
                    // successfully checked. See getMessagingSWVersion
                    sessionStorage.setItem(messagingSWUpdateKey, 'checked')
                }
                return versionData
            })
            // If the fetch or JSON-decode fails, just log.
            .catch((error) => {
                console.log(error)
            })
    )
}

/**
 * Get the current Messaging service worker version. The semantics of this
 * are a little complex.
 *
 * On the first call of a session, this function will return whatever
 * version it has stored in localStorage, and *also* kick off a network
 * request to update that. However, it will continue to return that same
 * initial version for all calls in the same session, so that the service
 * worker URL remains the same for that session. If there is a newer version,
 * it will be registered on the first call of the *next* session. This avoids
 * the service worker being unnecessarily updated during a session.
 *
 * @private
 * @return {string}
 */
export const getMessagingSWVersion = () => {
    // Once per session (as defined by sessionStorage lifetime), update
    // the messaging service worker version data.
    if (!isLocalStorageAvailable()) {
        return ''
    }
    // If we have not yet kicked off an async update of the version data,
    // do that now. The flag we check is set in session storage
    // when an update completes, so it will be done once per session.
    if (!sessionStorage.getItem(messagingSWUpdateKey)) {
        updateMessagingSWVersion()
    }

    // If we have stored a version string in session storage, return
    // that now. This will be true after the first call of a session.
    let version = sessionStorage.getItem(messagingSWVersionKey) || ''
    if (version) {
        return version
    }

    // Grab any version string stored in localStorage, update sessionStorage
    // and return it.
    version = localStorage.getItem(messagingSWVersionKey) || 'latest'
    sessionStorage.setItem(messagingSWVersionKey, version)
    return version
}

export const getWorkerQuery = (pwaMode, messagingEnabled, cacheHashManifest) => {
    //  This needs to be based on whether this is a CDN environment, rather than
    //  a preview environment. `web/service-worker-loader.js` will use this value
    //  to determine whether it should load from a local development server, or
    //  from the CDN.
    // DESKTOP-345 - as part of moving the SSR Loader into the SDK and fixing
    // it up, we also found that this flag (which sets the 'preview' query
    // parameters) was being set wrongly. For a Universal PWA, there is no
    // preview, so this should always be false.
    /* istanbul ignore next */
    const buildOrigin = getBuildOrigin()
    const isUniversal = window.Progressive && window.Progressive.isUniversal
    const IS_LOADED_LOCALLY = !isUniversal && buildOrigin.indexOf('cdn.mobify.com') === -1
    // This `preview` value will determine whether it should load from a
    // local development server, or from the CDN.
    //
    // The `IS_LOADED_LOCALLY` flag is used to set the value of the
    // `preview` query parameter. Technically, this parameter defines
    // whether the main code of the worker should come from the local
    // development server.
    const workerQuery =
        `?preview=${IS_LOADED_LOCALLY}` +
        // In order to allow previewing on origins other than local host, we pass
        // the build origin along to be used in the `service-worker-loader`. This will
        // allow developers to test bundles and to test using mobile devices.
        `&buildOrigin=${encodeURIComponent(buildOrigin)}` +
        // In addition to supporting local preview bundles, the
        // `service-worker-loader` also supports alternative environment
        // bundles. The `target` query parameter tells the loader which
        // environment (by URL) the worker should be loaded from. For example:
        // `production`, 'stage', 'dev', and so on.
        `&target=${window.Mobify.target || 'production'}` +
        // This catchbreaker is for the Messaging part of the worker
        `&b=${cacheHashManifest.buildDate}` +
        // The PWA parameter is used by the worker to tell if it's loaded to
        // support a PWA (pwa=1) or not. The 'pwa=1' or 'pwa=0' parameter in
        // this URL should not change format - the worker does a regex test to
        // match the exact string.
        `&pwa=${pwaMode ? 1 : 0}`

    const workerPathElements = [workerQuery]

    // In order to load the worker, we need to get the current Messaging
    // PWA service-worker version so that we can include it in the URL
    // (meaning that we will register a 'new' worker when that version
    // number changes).
    // The implementation here is designed to avoid adding an extra fetch
    // and slowing down the *first* run of the app. On the first run, we
    // will find nothing in localStorage, and return the URL without
    // any Messaging-worker parameters, but we'll do an asynchronous
    // fetch to update the parameters, which will then be used on the
    // next run. See getMessagingSWVersion for the exact semantics.
    if (messagingEnabled) {
        const swVersion = getMessagingSWVersion()
        /* istanbul ignore else */
        if (swVersion) {
            workerPathElements.push(`msg_sw_version=${swVersion}`)
        }
    }

    // Return the service worker path
    return workerPathElements.join('&')
}

/**
 * Get the URL that should be used to load the service worker.
 * This is based on the SW_LOADER_PATH but may have additional
 * query parameters added that act as further configurations
 * settings, or as cachebreakers for the Messaging part of the worker.
 *
 * @private
 * @param pwaMode {Boolean} true to register the worker with a URL that
 * enables PWA mode, false if not.
 * @returns String
 */
export const getServiceWorkerURL = (pwaMode, messagingEnabled, cacheHashManifest) => {
    // The getServiceWorkerURL function was created and made available to partners
    // for use before the getWorkerQuery and skipLoader changes were made
    // it's been left in place here to prevent breaking changes.
    return `/service-worker-loader.js${getWorkerQuery(
        pwaMode,
        messagingEnabled,
        cacheHashManifest
    )}`
}

/**
 * Load the service worker.
 *
 * In nonPWA mode, this will be called on every page. This is safe;
 * to quote https://developers.google.com/web/fundamentals/getting-started/primers/service-workers:
 * "You can call register() every time a page loads without concern;
 * the browser will figure out if the service worker is already registered
 * or not and handle it accordingly".
 *
 * Note, though, that this assumes the URL returned by getServiceWorkerURL
 * doesn't change between pages. If it does, then the worker will be
 * re-registered with a different URL, causing it to restart.
 * @function
 * @param pwaMode {Boolean} true if the worker should be loaded in
 * PWA mode, false if not
 * @param messagingEnabled {Boolean} true if messaging should be enabled
 * @param cacheHashManifest {object} The cacheHashManifest typically found in window.Progressive
 * @param skipLoader {Boolean} true if the service worker can be loaded directly without the use
 * of the service worker loader
 * @returns Promise.<Boolean> true when the worker is loaded and ready,
 * false if the worker fails to register, load or become ready.
 */
export const loadWorker = (pwaMode, messagingEnabled, cacheHashManifest, skipLoader) => {
    // This is used for fetching the service-worker-loader URL from local storage
    const STORED_SERVICE_WORKER_LOADER_URL = 'mobify-service-worker-loader-url'

    const isStorageAvailable = isLocalStorageAvailable()
    let url

    /* istanbul ignore else */
    if (isStorageAvailable) {
        url = window.localStorage.getItem(STORED_SERVICE_WORKER_LOADER_URL)
    }

    if (!url) {
        url = skipLoader
            ? `/worker.js${getWorkerQuery(pwaMode, messagingEnabled, cacheHashManifest)}`
            : // The getServiceWorkerURL function was created and made available to partners
              // for use before the getWorkerQuery and skipLoader changes were made
              // it's been left in place here to prevent breaking changes.
              getServiceWorkerURL(pwaMode, messagingEnabled, cacheHashManifest)
    }

    loaderLog(`Registering service worker ${url}`)

    // Note that we do not provide a scope to this call; we assume
    // the worker loader is served at the root of the site, so that
    // it controls the entire site.
    return navigator.serviceWorker
        .register(url)
        .catch((e) => {
            /* istanbul ignore next */
            const message = e.message || ''
            // This catch block can be removed for Salesforce Commerce Cloud
            // implementations. In which case, the service worker file name
            // defined in SW_LOADER_PATH should be modified to _not_ have a
            // `.js` extension in the file path.
            //
            // This 410 error message still means a bad HTTP response, but we
            // retrieve it from the message string expecting a specific service
            // worker related error message: "Failed to register a
            // ServiceWrorker: A bad HTTP response code (410) ..."
            if (message.indexOf('410') >= 0) {
                // Create a new url minus the .js extension and save it to
                // localStorage so it can be fetched in the future.
                const newUrl = url.replace('.js', '')
                loaderLog(`Re-registering service worker ${newUrl}`)

                /* istanbul ignore else */
                if (isStorageAvailable) {
                    window.localStorage.setItem(STORED_SERVICE_WORKER_LOADER_URL, newUrl)
                }

                return navigator.serviceWorker.register(newUrl)
            }

            throw e
        })
        .then(() => navigator.serviceWorker.ready)
        .then(() => {
            loaderLog('Service worker is ready')
            return true
        })
        .catch((e) => {
            // We're intentionally swallowing errors here, but logging the error
            // incase of issues such as localStorage running out of space
            console.error(e)
            return false
        })
}

/**
 * Preload the service worker when user visits AMP site.
 * @function
 * @param pwaMode {Boolean} true if the worker should be loaded in
 * PWA mode, false if not
 * @param messagingEnabled {Boolean} true if the messaging should be enabled
 * false if not
 * @param cacheHashManifest {JSON} updated hash manifest json object
 * PWA mode, false if not
 * @returns {Boolean} true when the requested for SW installation from
 * an AMP page, false elsewhere.
 */
export const preloadSWAmp = (pwaMode, messagingEnabled, cacheHashManifest) => {
    const path = window.location.pathname.slice(1)
    const result = path === 'sw.html'
    if (result) {
        loadWorker(pwaMode, messagingEnabled, cacheHashManifest)
    }
    return result
}
