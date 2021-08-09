/* global workbox, DEBUG */
/**
 * This is your project's Service Worker. It is loaded by `../app/loader.js`.
 *
 * For more information on customizing your Service Worker, see:
 *
 *  - https://developers.google.com/web/fundamentals/primers/service-workers/
 *  - https://developers.google.com/web/tools/workbox/
 */
import {
    startDownloadTracker,
    COMPATIBILITY_MODES
} from 'progressive-web-sdk/dist/worker/download-tracker'

const WORKBOX_VERSION = '3.6.1'
const WORKBOX_URL = `https://storage.googleapis.com/workbox-cdn/releases/${WORKBOX_VERSION}/workbox-sw.js`

self.importScripts(WORKBOX_URL)

workbox.setConfig({debug: DEBUG})

// Place your Workbox route configurations here, eg:
// workbox.routing.registerRoute(...)

// This must come after all other workbox route configurations.
startDownloadTracker(workbox.routing, DEBUG, {mode: COMPATIBILITY_MODES.WORKBOX})
