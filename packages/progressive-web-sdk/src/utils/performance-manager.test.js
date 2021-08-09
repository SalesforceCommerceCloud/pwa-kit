/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import sinon from 'sinon'

import {DownloadManager} from './download-manager'
import {PerformanceManager} from './performance-manager'
import {PWADeferredProcessingStateEvent} from './task-utils'

import Logger from './logger'

const sandbox = sinon.sandbox.create()

// Set this to true if you're fixing up tests and need debug output
Logger.setDebug(false)

// Save the native Promise implementation
const originalPromise = window.Promise

afterEach(() => {
    sandbox.restore()
    PerformanceManager.reset()
    window.Promise = originalPromise
})

describe('Task splitting', () => {
    test('setTaskSplitting works', () => {
        // The standard Promise has no setScheduler, so we check
        // that to verify that Bluebird isn't installed at this point.
        expect(window.Promise.setScheduler).toBeUndefined()

        const manager = PerformanceManager.getManager()
        const resultPromise = manager.setTaskSplitting(true)

        // Bluebird should now be the global Promise implementation,
        // and task-splitting should be enabled.
        expect(window.Promise.setScheduler).toBeDefined()
        expect(manager.taskSplittingEnabled).toBeTruthy()

        // Verify that the Promise returned from setTaskSplitting
        // looks like a Bluebird Promise.
        expect(resultPromise.isFulfilled).toBeDefined()
        expect(resultPromise.isFulfilled()).toBeTruthy()

        // Now execute a Promise with a then-handler - that handler
        // should be executed by 'defer', and cause a
        // PWADeferredProcessingStateEvent event to fire.
        // The event will fire after the deferred then-handler.
        return new Promise((resolve) => {
            addEventListener(
                PWADeferredProcessingStateEvent,
                (event) => {
                    expect(event.processing).toBeTruthy()
                    manager.setTaskSplitting(false)
                    expect(manager.taskSplittingEnabled).toBeFalsy()
                    resolve()
                },
                {once: true}
            )
            resolve()
        }).then(() => {
            // We don't need to do anything here
        })
    })

    test("setTaskSplitting doesn't do anything when running serverSide", () => {
        window.Progressive = {
            isServerSide: true
        }

        const manager = PerformanceManager.getManager()
        return manager
            .setTaskSplitting(true)
            .then(() => {
                expect(manager.taskSplittingEnabled).toBeFalsy()
            })
            .finally(() => {
                delete window.Progressive
            })
    })

    test('setTaskSplitting passes options', () => {
        const options = {
            longStackTraces: true
        }

        window.Promise = require('bluebird/js/browser/bluebird.min')
        const config = sandbox.stub(window.Promise, 'config')

        const manager = PerformanceManager.getManager()
        return manager.setTaskSplitting(true, options).then(() => {
            expect(config.calledWith(options)).toBeTruthy()
        })
    })

    test('Task-splitting wraps fetch', () => {
        // Replace window.fetch with a stub that we can test
        const stubFetch = sandbox.stub(window, 'fetch').returns(Promise.resolve())
        expect(window.fetch).toBe(stubFetch)

        const manager = PerformanceManager.getManager()
        manager.setTaskSplitting(true)

        expect(window.fetch).not.toBe(stubFetch)

        const fetchPromise = fetch().then(() => {
            // Check that the promise looks like a Bluebird Promise
            expect(fetchPromise.isFulfilled).toBeDefined()
        })
        return fetchPromise
    })

    test('Task-splitting can be enabled and disabled', () => {
        const originalFetch = window.fetch
        const manager = PerformanceManager.getManager()
        manager.setTaskSplitting(true)

        const originalScheduler = manager._previousScheduler

        expect(window.Promise.setScheduler).toBeDefined()
        expect(window.Promise._async._customScheduler).toBeTruthy()
        expect(window.Promise._async._schedule).toBe(PerformanceManager.defer)
        expect(manager.taskSplittingEnabled).toBeTruthy()
        expect(window.fetch).not.toBe(originalFetch)

        manager.setTaskSplitting(false)
        expect(window.Promise._async._schedule).toBe(originalScheduler)
        expect(manager.taskSplittingEnabled).toBeFalsy()
        expect(window.fetch).toBe(originalFetch)
    })

    test('Defer works via Performance Manager', (done) => {
        PerformanceManager.defer(done)
    })
})

describe('Download management', () => {
    test('configureDownloads works', () => {
        const downloadManager = DownloadManager.getManager()
        sandbox.stub(downloadManager, 'configure').returns(Promise.resolve(true))

        const performanceManager = PerformanceManager.getManager()
        expect(performanceManager.downloadManagementEnabled).toBeFalsy()

        const fakeFilters = [1, 2, 3]
        const resultPromise = performanceManager.configureDownloads({
            maxDownloads: 3,
            priorityFilters: fakeFilters
        })

        // Verify that the Promise returned from setTaskSplitting
        // looks like a native Promise.
        expect(resultPromise.isFulfilled).toBeUndefined()
        return resultPromise.then((configured) => {
            expect(configured).toBeTruthy()
            expect(downloadManager.maxDownloads).toBe(3)
            expect(downloadManager.priorityFilters).toEqual(
                DownloadManager.defaultPriorityFilters.concat(fakeFilters)
            )
            expect(performanceManager.downloadManagementEnabled).toBeTruthy()
        })
    })

    test('configureDownloads works with task-splitting', () => {
        const performanceManager = PerformanceManager.getManager()
        performanceManager.setTaskSplitting(true)

        // Because there is no service worker implemented in the Jest
        // environment, this will not do any configuration, but it
        // will return a Promise.
        const resultPromise = performanceManager.configureDownloads()

        // Verify that the Promise returned from setTaskSplitting
        // looks like a Bluebird Promise.
        expect(resultPromise.isFulfilled).toBeDefined()

        return resultPromise.then(() => {
            expect(resultPromise.isFulfilled()).toBeTruthy()
            expect(performanceManager.downloadManagementEnabled).toBeFalsy()
        })
    })

    test('Empty configuration works', () => {
        const performanceManager = PerformanceManager.getManager()
        const downloadManager = DownloadManager.getManager()
        sandbox.stub(downloadManager, 'configure').returns(Promise.resolve())

        expect(performanceManager.downloadManagementEnabled).toBeFalsy()
        performanceManager.configureDownloads()
        expect(performanceManager.downloadManagementEnabled).toBeFalsy()
    })
})

describe('Busy flags set by events', () => {
    test('PWA is not busy by default', () => {
        const manager = PerformanceManager.getManager()
        expect(manager.cpuBusy).toBeFalsy()
        expect(manager.netBusy).toBeFalsy()
        expect(manager.pwaBusy).toBeFalsy()
        expect(manager.pwaIsQuiet).toBeTruthy()
    })

    test('Processing busy means PWA busy', () => {
        const manager = PerformanceManager.getManager()
        expect(manager.pwaIsQuiet).toBeTruthy()
        manager.taskSplittingEnabled = true

        const event = new Event(PWADeferredProcessingStateEvent)
        event.processing = true
        dispatchEvent(event)

        expect(manager.cpuBusy).toBeTruthy()
        expect(manager.netBusy).toBeFalsy()
        expect(manager.docBusy).toBeFalsy()
        expect(manager.pwaBusy).toBeTruthy()
        expect(manager.pwaIsQuiet).toBeFalsy()
    })

    test('Network busy means PWA busy', () => {
        const manager = PerformanceManager.getManager()
        expect(manager.pwaIsQuiet).toBeTruthy()
        manager.downloadManagementEnabled = true

        const event = new Event(DownloadManager.PWANetworkEvent)
        event.networkBusy = true
        dispatchEvent(event)

        expect(manager.cpuBusy).toBeFalsy()
        expect(manager.netBusy).toBeTruthy()
        expect(manager.docBusy).toBeFalsy()
        expect(manager.pwaBusy).toBeTruthy()
        expect(manager.pwaIsQuiet).toBeFalsy()
    })

    test('Document busy means PWA busy', () => {
        const documentIsComplete = sandbox.stub(PerformanceManager, '_docIsComplete')
        documentIsComplete.returns(false)

        const manager = PerformanceManager.getManager()
        expect(manager.docBusy).toBeTruthy()
        expect(manager.pwaIsQuiet).toBeFalsy()

        documentIsComplete.returns(true)
        dispatchEvent(new Event('readystatechange'))

        expect(manager.pwaBusy).toBeTruthy()
        expect(manager.pwaIsQuiet).toBeFalsy()
    })
})

describe('Quiet flag * events', () => {
    let savedQuietDelay

    beforeEach(() => {
        savedQuietDelay = PerformanceManager.QUIET_EVENT_DELAY_MS
        PerformanceManager.QUIET_EVENT_DELAY_MS = 50
    })

    afterEach(() => {
        PerformanceManager.QUIET_EVENT_DELAY_MS = savedQuietDelay
    })

    test('Event sent on transition to not-busy', () => {
        return (
            new Promise((resolve) => {
                const manager = PerformanceManager.getManager()
                manager.taskSplittingEnabled = true

                manager.cpuBusy = manager.pwaBusy = true

                addEventListener(
                    PerformanceManager.PWAQuietEvent,
                    () => resolve(manager.pwaIsQuiet),
                    {once: true}
                )

                const event = new Event(PWADeferredProcessingStateEvent)
                event.processing = false
                dispatchEvent(event)
            })
                // Verify that the PWA reported itself as quiet within
                // the event handler.
                .then((wasQuiet) => {
                    expect(wasQuiet, 'Expected that PWA would be quiet in event handler').toBe(true)
                })
        )
    })

    test('Event not sent if busy state is resumed', () => {
        const manager = PerformanceManager.getManager()
        manager.taskSplittingEnabled = true
        manager.cpuBusy = manager.pwaBusy = true
        expect(manager._quietEventHandle).toBeNull()

        // Clear the busy state (queues quiet event)
        const event = new Event(PWADeferredProcessingStateEvent)
        event.processing = false
        dispatchEvent(event)

        expect(manager._quietEventHandle).not.toBeNull()

        // Set the busy state (cancels the quiet event)
        event.processing = true
        dispatchEvent(event)

        expect(manager._quietEventHandle).toBeNull()
    })

    test('Event sent on document state change if no features enabled', (done) => {
        const readyState = sandbox.stub(document, 'readyState').value('interactive')
        const manager = PerformanceManager.getManager()
        expect(manager.docBusy).toBeTruthy()

        addEventListener(PerformanceManager.PWAQuietEvent, done(), {once: true})

        // JSDom won't fire the event - we must do that ourselves
        readyState.value('complete')
        window.document.dispatchEvent(new Event('readystatechange'))
    })

    test('CallWhenQuiet fires immediately when PWA is not busy', (done) => {
        const manager = PerformanceManager.getManager()
        manager.pwaBusy = false
        manager.callWhenQuiet(done)
    })

    test('CallWhenQuiet fires on PWAQuietEvent', (done) => {
        const manager = PerformanceManager.getManager()
        manager.pwaBusy = manager.docBusy = true

        manager.callWhenQuiet(done)
        window.document.dispatchEvent(new Event('readystatechange'))
    })
})
