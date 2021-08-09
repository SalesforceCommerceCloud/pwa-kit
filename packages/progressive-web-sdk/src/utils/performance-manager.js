/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/*
 This file contains the PerformanceManager code.
 The PerformanceManager doesn't have one single "initialize" call,
 because it's reasonable that PWA code might need to configure the different
 PerformanceManager functions separately (and more than once). There are
 separate functions provided to control those functions.
*/

import {DownloadManager} from './download-manager'
import {HIGH, NORMAL, LOW, UNTHROTTLED} from './download-shared'
import {defer, logger, PWADeferredProcessingStateEvent} from './task-utils'
import {runningServerSide} from './utils'

/**
 * Debug log helper to avoid duplicating strings
 */
const isOrIsNotBusy = (what, flag) => `${what} is ${flag ? '' : 'not '}busy`

const _readyStateChange = 'readystatechange'

export class PerformanceManager {
    constructor() {
        // References to classes to reduce JS size
        this._dm = DownloadManager
        this._pm = PerformanceManager

        /**
         * The last known busy states (busy is true if either the network
         * or processing are in progress, or the document isn't yet complete).
         */
        this.cpuBusy = false
        this.netBusy = false
        // On construction, our overall busy state is set by whether
        // the document is complete yet.
        this.pwaBusy = this.docBusy = !this._pm._docIsComplete()

        /**
         * Whether task-splitting and download-management are in use or not.
         */
        this.taskSplittingEnabled = false
        this.downloadManagementEnabled = false

        /**
         * setTimeout handle to a pending task that will send a PWAQuietEvent
         */
        this._quietEventHandle = null

        /**
         * The previous promise scheduler in use before setScheduler is called.
         * See setTaskSplitting.
         */
        this._previousScheduler = null

        /**
         * Flag set when Bluebird is installed as window.Promise
         */
        this._bluebirdInstalled = false

        /**
         * The original implementation of 'fetch', wrapped by
         * setTaskSplitting
         */
        this._originalFetch = null

        // Reference to a DownloadManager instance, created on demand
        this._downloadManager = null

        // Event handling
        this._boundHandleEvent = this._handleEvent.bind(this)

        window.addEventListener(this._dm.PWANetworkEvent, this._boundHandleEvent)
        window.addEventListener(PWADeferredProcessingStateEvent, this._boundHandleEvent)
        window.document.addEventListener(_readyStateChange, this._boundHandleEvent)

        logger.log('PerformanceManager created')
    }

    // This function is only provided so that the PerformanceManager
    // can be reset for testing. It's not needed in production.
    destroy() {
        window.removeEventListener(this._dm.PWANetworkEvent, this._boundHandleEvent)
        window.removeEventListener(PWADeferredProcessingStateEvent, this._boundHandleEvent)
        window.document.removeEventListener(_readyStateChange, this._boundHandleEvent)
        if (this._quietEventHandle) {
            clearTimeout(this._quietEventHandle)
        }
        /* istanbul ignore next */
        if (this._previousScheduler && window.Promise.setScheduler) {
            window.Promise.setScheduler(this._previousScheduler)
        }
        if (this._originalFetch) {
            window.fetch = this._originalFetch
        }
    }

    static _docIsComplete() {
        return window.document.readyState === 'complete'
    }

    /**
     * Check the cpuBusy and netBusy flags, and update the
     * PWA's "busy" state. If the PWA was busy and becomes not-busy, then
     * queue a PWAQuietEvent.
     */
    _setState() {
        logger.log(isOrIsNotBusy('Net', this.netBusy))
        logger.log(isOrIsNotBusy('CPU', this.cpuBusy))
        logger.log(isOrIsNotBusy('Doc', this.docBusy))

        // We only consider the cpuBusy and netBusy flags
        // if the corresponding PerformanceManager function is
        // enabled.
        const busy =
            (this.taskSplittingEnabled && this.cpuBusy) ||
            (this.downloadManagementEnabled && this.netBusy) ||
            this.docBusy
        logger.log(`Therefore ${isOrIsNotBusy('PWA', busy)}`)

        if (!this.pwaBusy && busy) {
            // If we switch from not-busy to busy, we cancel any pending
            // quiet event.
            if (this._quietEventHandle) {
                logger.log(`Cancelling pending ${this._pm.PWAQuietEvent}`)
                clearTimeout(this._quietEventHandle)
                this._quietEventHandle = null
            }
        } else if (this.pwaBusy && !busy) {
            // If we switch from busy to not-busy, we queue a pending
            // quiet event.
            logger.log(`Queuing ${this._pm.PWAQuietEvent}`)
            this._quietEventHandle = setTimeout(() => {
                logger.log(`Sending ${this._pm.PWAQuietEvent}`)
                this._quietEventHandle = null
                dispatchEvent(new Event(this._pm.PWAQuietEvent))
            }, this._pm.QUIET_EVENT_DELAY_MS)
        }

        // Update the saved state
        this.pwaBusy = busy
    }

    /**
     * Handler for network and processing events, that tracks whether either
     * is busy.
     */
    _handleEvent(event) {
        logger.log(`handleEvent ${event.type}`)
        switch (event.type) {
            case this._dm.PWANetworkEvent:
                this.netBusy = event.networkBusy
                break
            case PWADeferredProcessingStateEvent:
                this.cpuBusy = event.processing
                break
            case _readyStateChange:
                this.docBusy = !this._pm._docIsComplete()
                break
            /* istanbul ignore next */
            default:
                return
        }
        this._setState()
    }

    /**
     * Get the current idle state of the PWA (true/false).
     * A PWA may use this in conjunction with the PWAQuietEvent
     * to defer processing or resource loading until the PWA is idle.
     */
    get pwaIsQuiet() {
        // The PWA is quiet if (1) this.pwaBusy is false, and (2)
        // this._quietEventHandle is null. If the handle is not null,
        // then an event is pending, and might be cancelled.
        return !(this.pwaBusy || this._quietEventHandle)
    }

    /**
     * If the PWA is quiet, call the given function immediately.
     * If the PWA is not quiet, arrange to call the function when it
     * becomes quiet.
     * @param func
     */
    callWhenQuiet(func) {
        if (this.pwaIsQuiet) {
            func()
        } else {
            addEventListener(this._pm.PWAQuietEvent, () => func(), {once: true})
        }
    }

    /**
     * Task splitting breaks up processing on the main thread so that it's done
     * in separate tasks. This helps avoid tying up the main thread, which
     * has a negative effect on the PWAs response to user input, and delays
     * Time-To-Interactive.
     *
     * If this function is not called, task-splitting is disabled.
     *
     * Task-splitting can only be enabled when the Promise object
     * has a setScheduler function. This is provided by Bluebird. Calling
     * this function to control task-splitting when there is no
     * setScheduler will throw an Error.
     *
     * @param split {boolean} - true to enable task splitting, false to
     * disable it.
     * @param options {*} - an object with options for Bluebird's Promise
     * (see http://bluebirdjs.com/docs/api/promise.config.html). This allows
     * development builds to include long stack traces.
     */
    setTaskSplitting(split, options) {
        // Within this code, we must refer to Promise as window.Promise, because
        // under Jest tests, 'Promise' refers to a babel-runtime implementation,
        // and test code cannot stub functions on the 'global' Promise.
        logger.log(`${split ? 'En' : 'Dis'}abling task splitting - configuring Promise scheduler`)

        // If we're running server-side, we will never enable task-splitting.
        const reallySplit = split && !runningServerSide()

        if (reallySplit) {
            // Install Bluebird promises. We don't revert this if we're
            // later called to turn off task splitting.
            /* istanbul ignore else */
            if (!this._bluebirdInstalled) {
                window.Promise = require('bluebird/js/browser/bluebird.min')
                this._bluebirdInstalled = true
                if (options) {
                    window.Promise.config(options)
                }
            }

            // We save the previous scheduler when we install 'defer' as the
            // new scheduler. If previousScheduler is already set, we don't need
            // to do anything.
            /* istanbul ignore else */
            if (!this._previousScheduler) {
                this._previousScheduler = window.Promise.setScheduler(defer)

                // Save the original fetch implementation, and wrap
                // window.fetch so that it returns a Bluebird Promise.
                const originalFetch = (this._originalFetch = window.fetch)
                window.fetch = (input, init) => {
                    return new window.Promise((resolve, reject) => {
                        originalFetch(input, init)
                            .then(resolve)
                            .catch(reject)
                    })
                }
            }
        } else {
            // If previousScheduler is not set, then we didn't install 'defer'
            // as the scheduler, and we don't need to do anything.
            /* istanbul ignore else */
            if (this._previousScheduler) {
                window.Promise.setScheduler(this._previousScheduler)
                this._previousScheduler = null
            }
            if (this._originalFetch) {
                window.fetch = this._originalFetch
                this._originalFetch = null
            }
        }

        this.taskSplittingEnabled = !!reallySplit
        this._setState()

        // Return a resolved Promise so that calling code can chain
        // 'then' handlers on it, that will be handled by task-splitting
        // if configured.
        return window.Promise.resolve()
    }

    /**
     * Called to configure download management. Returns a Promise
     * that resolves when the download manager is connected to the worker
     * and in operation.
     *
     * The options object may have the following properties:
     * The 'maxDownloads' (number) property should be the maximum number of downloads
     * to allow at any one time. A value of 0 disables throttling (allows
     * any number of downloads).
     * The optional 'priorityFilters' property is a list of filters that can
     * set the priority of throttled downloads (or exempt them from throttling)
     * based on their URLs.
     * Each filter is an object with two properties. The 'regexp' property is
     * a regular expression string to be matched against URLs using regexp.test
     * (so it must match the whole URL). The 'priority' property is one of the
     * HIGH, NORMAL, LOW or UNTHROTTLED constant strings.
     */
    configureDownloads(options) {
        /* istanbul ignore else */
        if (!this._downloadManager) {
            this._downloadManager = this._dm.getManager()
        }

        if (options) {
            /* istanbul ignore else */
            if (options.maxDownloads !== undefined) {
                this._downloadManager.maxDownloads = options.maxDownloads
            }

            // If there's any limit on downloads, then
            // we consider that network management is enabled.
            this.downloadManagementEnabled = !!this._downloadManager.maxDownloads

            /* istanbul ignore else */
            if (options.priorityFilters) {
                this._downloadManager.priorityFilters = options.priorityFilters
            }
        }

        return (
            this._downloadManager
                .configure()
                // If there's no service worker, then 'enabled' will be false,
                // and we mark download management as disabled.
                .then((enabled) => {
                    this.downloadManagementEnabled = enabled
                })
                // Call _setState when the download manager has been configured,
                // and return whether download management was enabled.
                .then(() => {
                    this._setState()
                    return this.downloadManagementEnabled
                })
        )
    }
}

/**
 * Const event name for the event that is sent when the PWA
 * becomes idle.
 * The event is sent whenever the PWA was busy and then becomes
 * idle. Once it's been sent, it won't be sent again until
 * the PWA becomes busy and then goes idle. The pwaIsQuiet
 * function can be used to check whether the PWA is idle
 * at any point.
 * Listeners for this event should listen on the global object
 * (i.e. 'window'). It would be better if PerformanceManager were
 * an EventTarget, but EventTarget is not constructible before Chrome
 * 64/FF 59, and is not constructible in Safari or IE. An alternative
 * implementation could use an internal documentFragment owned by
 * the PerformanceManager singleton, but given that we're only sending
 * one event, it's simpler to use a custom event on the global object.
 */
PerformanceManager.PWAQuietEvent = 'pwaQuietEvent'

/**
 * Delay between the PWA becoming quiet (not busy) and the sending of
 * the PWAQuietEvent to report that.
 */
PerformanceManager.QUIET_EVENT_DELAY_MS = 2000

/**
 * Priority constants
 */
PerformanceManager.HIGH = HIGH
PerformanceManager.NORMAL = NORMAL
PerformanceManager.LOW = LOW
PerformanceManager.UNTHROTTLED = UNTHROTTLED

/**
 * Make defer available via the PerformanceManager to avoid
 * the need to import task-utils.
 */
PerformanceManager.defer = defer

let manager

/**
 * Standard factory method to get singleton PerformanceManager instance.
 * @returns {PerformanceManager}
 */
PerformanceManager.getManager = () => {
    /* istanbul ignore else */
    if (!manager) {
        manager = new PerformanceManager()
    }
    return manager
}

/**
 * For testing, removes the singleton instance.
 */
PerformanceManager.reset = () => {
    DownloadManager.reset()
    /* istanbul ignore else */
    if (manager) {
        manager.destroy()
        manager = null
    }
}
