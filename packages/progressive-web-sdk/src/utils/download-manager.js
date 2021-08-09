/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/*
 This file contains the DownloadManager code. The DownloadManager is the
 client-side code that communicates with the DownloadTracker in the
 service worker.

 This module is used by the PerformanceManager, and the tests for that
 module require that this module is mocked. To make the mocking easier,
 the DownloadManager is implemented as a Jest-mockable class.
 */
import {runningServerSide} from './utils'
import Logger from './logger'
import {
    CONFIGURE_THROTTLING,
    CONFIGURED_THROTTLING,
    NETWORK_BUSY_STATUS,
    UNTHROTTLED
} from './download-shared'

/**
 * Logger for this module.
 * @private
 */
const logger = new Logger('[DownloadManager]')

/**
 * @private
 */
export class DownloadManager {
    constructor() {
        /**
         * The maximum number of downloads that can be in flight before we
         * consider that the network is no longer quiescent (for TTI). We
         * may throttle downloads if the number of downloads in progress
         * reaches (or exceeds) this maximum.
         * If this is undefined or zero (falsy), then there's no throttling.
         *
         * This value is initially set, but can be overridden when the
         * DownloadManager is configured.
         *
         */
        this._maxDownloads = 2

        /**
         * A list of "priority filters". See configureDownloadManager.
         */
        this._priorityFilters = []

        /**
         * Flag for server-side running: may be overridden in tests.
         */
        this._isServerSide = runningServerSide()

        /**
         * The MessageChannel that is used to communicate with the service
         * worker, created on demand.
         */
        this._messageChannel = null

        this._swMessageHandler = this.swMessageHandler.bind(this)
    }

    /**
     * Post the given message to the given target. Creates a MessageChannel
     * on the first call, saves it in messageChannel (for reuse) and
     * attaches swMessageHandler as an event handler on the reply port.
     *
     * @param target {ServiceWorker} (technically, any Worker class)
     * @param message {object}
     */
    postMessage(target, message) {
        /* istanbul ignore else */
        if (!this._messageChannel) {
            this._messageChannel = new MessageChannel()
            this._messageChannel.port1.onmessage = this._swMessageHandler
        }
        target.postMessage(message, [this._messageChannel.port2])
    }

    /**
     * Handles a message posted from the service worker to this client code.
     */
    swMessageHandler(event) {
        const data = event.data
        if (data) {
            let replyEvent

            switch (data.command) {
                case CONFIGURED_THROTTLING: {
                    logger.log(`Configured service worker: ${JSON.stringify(data)}`)
                    replyEvent = new Event(DownloadManager.PWADownloadManagerReadyEvent)
                    replyEvent.data = event.data
                    break
                }

                case NETWORK_BUSY_STATUS: {
                    /* istanbul ignore next */
                    logger.log(`Network ${data.netBusy ? 'is' : 'is not'} busy`)
                    replyEvent = new Event(DownloadManager.PWANetworkEvent)
                    replyEvent.netBusy = data.netBusy
                    break
                }

                default:
                    logger.log(`Unknown message with command: ${data.command}`)
                    break
            }

            if (replyEvent) {
                dispatchEvent(replyEvent)
            }
        }
    }

    /**
     * Called via navigator.serviceWorker.ready when there is an active worker.
     * Posts the most recent configuration settings to the worker. The reply
     * from the worker will resolve any pending Promise returned from
     * configureDownloadManager.
     */
    swReady(registration, resolve) {
        const worker = registration.active
        if (worker) {
            logger.log('Configuring service worker...')

            // Arrange for resolve to be called when the download manager
            // is ready
            addEventListener(DownloadManager.PWADownloadManagerReadyEvent, () => resolve(true), {
                once: true
            })

            // Pass the configuration options to the worker. When it's
            // configured, we expect a PWADownloadManagerReadyEvent.
            this.postMessage(worker, {
                command: CONFIGURE_THROTTLING,
                maxDownloads: this._maxDownloads,
                priorityFilters: this._priorityFilters,
                debug: Logger.isDebug()
            })
        } else {
            // This should never happen
            logger.log('There is no active worker. Cannot configure')
            resolve(false)
        }
    }

    /**
     * Called by the PerformanceManager to configure everything once
     * maxDownloads and/or priorityFilters have been set.
     *
     * If the environment (the browser) doesn't support service workers,
     * or if there is no service worker installed, or we're running
     * server-side, then this function will return a promise that
     * immediately resolves to false, and the download manager will not
     * be configured. Downloads will not be managed, but the PWA can
     * still operate as usual.
     *
     * Explicitly uses window.Promise, so that if task-splitting
     * has been configured, then-handlers will use Bluebird Promises.
     *
     * @returns {Promise} that resolves once the configuration data
     * has been passed to the service worker, and the worker has
     * acknowledged it. The Promise resolves to true to indicate
     * successful configuration.
     */
    configure() {
        const sw = navigator.serviceWorker

        // If we're serverSide, there's no service worker to talk to.
        // If navigator.serviceWorker isn't defined, then the browser
        // doesn't support service workers.
        // If navigator.serviceWorker.controller is null, then there is
        // no active service worker.
        if (this._isServerSide || !sw || !sw.controller) {
            logger.log('Service worker unsupported or not active, skipping configuration')
            return window.Promise.resolve(false)
        }

        logger.log('Waiting for service worker to be ready')
        return new window.Promise((resolve) => {
            sw.ready.then((registration) => {
                logger.log('Service worker is ready')
                return this.swReady(registration, resolve)
            })
        })
    }

    /**
     * Allows the PerformanceManager to handle configuration.
     */
    set maxDownloads(newMaxDownloads) {
        this._maxDownloads = newMaxDownloads || 0
    }

    /**
     * Exported to allow the PerformanceManager to handle configuration.
     */
    set priorityFilters(newPriorityFilters) {
        this._priorityFilters = newPriorityFilters
            ? DownloadManager.defaultPriorityFilters.concat(newPriorityFilters)
            : DownloadManager.defaultPriorityFilters
    }

    get maxDownloads() {
        return this._maxDownloads
    }

    get priorityFilters() {
        return this._priorityFilters
    }
}

/**
 * Const for event that is sent when the network state changes between
 * busy and not busy. The event has a netBusy boolean property.
 */
DownloadManager.PWANetworkEvent = 'pwaNetworkEvent'

/**
 * Internal custom event name (exported for tests)
 * @private
 */
DownloadManager.PWADownloadManagerReadyEvent = 'pwaDownloadManagerReady'

/**
 * A set of default priority filters that are always configured.
 * @private
 */
DownloadManager.defaultPriorityFilters = [
    // The loader is *always* unthrottled. On the first load of the
    // PWA, the worker will not be installed at the time that the loader
    // is loaded, so this has no effect. However, on any subsequent load,
    // the worker will already be active, and will intercept the loader.
    // Apply the same logic to the SSR loader.
    {
        regexp: '(ssr-)?loader\\.js.*',
        priority: UNTHROTTLED
    }
]

let manager

/**
 * Standard factory method to get the manager.
 * @returns {DownloadManager}
 */
DownloadManager.getManager = () => {
    /* istanbul ignore else */
    if (!manager) {
        manager = new DownloadManager()
    }
    return manager
}

/**
 * For testing: reset the singleton DownloadManager
 * @private
 */
DownloadManager.reset = () => {
    manager = null
}
