/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env worker, serviceworker */

// This MUST be imported before sw-toolbox so that the download-tracker's
// fetch event handler takes precedence over the toolbox one.
import {startDownloadTracker} from './download-tracker'

import toolbox from 'sw-toolbox'

const version = '0.2.2'

const worker = ({offlinePaths, precacheUrls = [], slug, isDebug}) => {
    if (!slug) {
        throw new Error('Slug must be provided to worker!')
    }

    const cachebreaker = self.location.search ? /b=([^&]+)/.exec(self.location.search)[1] : ''

    const baseCacheName = `${slug}-v${version}`
    toolbox.options.cache.name = baseCacheName
    toolbox.options.cache.maxAgeSeconds = 86400
    toolbox.options.debug = isDebug

    // Configure the download tracker, passing the toolbox router
    // so that the tracker can look up the handler for a given URL.
    startDownloadTracker(toolbox.router, isDebug)

    // No cache maintenance options here on purpose, this is a permanent cache
    const bundleCache = {
        name: `${baseCacheName}-bundle-${cachebreaker}`
    }

    const imageCache = {
        name: `${baseCacheName}-images`,
        maxEntries: 40
    }

    const cacheNames = [baseCacheName, bundleCache.name, imageCache.name]

    toolbox.precache(precacheUrls)

    // Lifecycle Handlers

    self.addEventListener('install', (e) => {
        e.waitUntil(
            self.skipWaiting().then(() => {
                if (isDebug) {
                    console.log('[ServiceWorker] Installed version', version)
                }
            })
        )
    })

    self.addEventListener('activate', (e) => {
        e.waitUntil(
            self.clients
                .claim()
                .then(() => caches.keys())
                .then((cacheKeys) =>
                    cacheKeys.filter(
                        (key) =>
                            cacheNames.indexOf(key) === -1 &&
                            !key.endsWith('$$$inactive$$$') &&
                            // Do not delete any messaging-caches
                            !key.startsWith('messaging-cache')
                    )
                )
                .then((keysToDelete) => keysToDelete.map((key) => caches.delete(key)))
                .then((promises) => Promise.all(promises))
        )
    })

    const noCacheJSONResponse = (json) => {
        return new Response(new Blob([JSON.stringify(json)], {type: 'application/json'}), {
            status: 200,
            statusText: 'OK',
            headers: new Headers({
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            })
        })
    }

    // App makes this asset request on each page fetch, expecting to see empty JSON
    // if network supplies successful response.
    // In the case of failure, we modify response to be `{offline: true}` which
    // indicates to app that we are offline.
    const checkIfOffline = (request) =>
        fetch(new Request(request, {cache: 'no-store'})).catch(() =>
            noCacheJSONResponse({offline: true})
        )

    // For enabling offline detection within the application
    toolbox.router.get(/online\.mobify\.net\/offline\.json/, checkIfOffline)

    // Path Handlers

    // Bundle contents
    toolbox.router.get(/cdn\.mobify\.com\/.*\?[a-f\d]+$/, toolbox.cacheFirst, {cache: bundleCache})
    toolbox.router.get(/localhost:8443.*\?[a-f\d]+$/, toolbox.networkFirst, {cache: bundleCache})
    // Keep the preview response around for offline in preview mode
    toolbox.router.get(/https:\/\/preview.mobify.com\/v7/, toolbox.networkFirst, {
        cache: bundleCache
    })

    // Cache data from the Mobify CDN (localhost in testing)
    // This includes the loader and the Capturing script.
    toolbox.router.get(/cdn\.mobify\.com|localhost:8443/, toolbox.networkFirst, {
        cache: bundleCache
    })

    // Google fonts
    toolbox.router.get(/fonts\.gstatic\.com\/.*\.woff2$/, toolbox.cacheFirst, {cache: bundleCache})
    toolbox.router.get(/fonts\.googleapis\.com\/css/, toolbox.networkFirst, {cache: bundleCache})

    // Typekit fonts
    toolbox.router.get(/use\.typekit\.net\/[a-z0-9]+\.js/, toolbox.networkFirst, {
        cache: bundleCache
    })
    toolbox.router.get(/use\.typekit\.net\/.*\//, toolbox.cacheFirst, {cache: bundleCache})

    // Main page is needed for installed app when offline
    toolbox.router.get('/', toolbox.networkFirst, {cache: bundleCache})
    ;(offlinePaths || []).forEach((path) => {
        toolbox.router.get(new RegExp(path), toolbox.networkFirst, {cache: bundleCache})
    })

    // Image cache
    toolbox.router.get(/\.(?:png|gif|svg|jpe?g)(?:\?|$)/i, toolbox.fastest, {cache: imageCache})

    toolbox.router.default = toolbox.networkFirst

    // Return an object with the toolbox module in it, so that other
    // worker components can extend it.
    return {
        baseCacheName,
        cachebreaker,
        isDebug,
        toolbox
    }
}

export default worker
