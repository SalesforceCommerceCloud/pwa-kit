/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/*
 The download-manager module is client-side, so we use the Jest JSDOM
 environment. However it expects to communicate with a service worker,
 so this test module provides a *minimal* mock worker environment.
 */
import sinon from 'sinon'

import {DownloadManager} from './download-manager'

import Logger from './logger'
import {CONFIGURE_THROTTLING, CONFIGURED_THROTTLING, NETWORK_BUSY_STATUS} from './download-shared'

/**
 * A fake MessagePort implementation, to be used with MessageChannel below.
 * EventTarget only got a constructor in Chrome 64, FF 59, and JSDom doesn't
 * have it yet, so we have to delegate the event handling to 'window'.
 */
class MessagePort {
    constructor(other) {
        this._open = false
        this._other = other

        // We could replace 'window' with 'new EventTarget when
        // JSDom supports that, or extend EventTarget.
        this._eventTarget = window
    }

    set other(port) {
        this._other = port
    }

    addEventListener(...args) {
        return this._eventTarget.addEventListener(...args)
    }

    removeEventListener(...args) {
        return this._eventTarget.removeEventListener(...args)
    }

    dispatchEvent(event) {
        return this._eventTarget.dispatchEvent(event)
    }

    set onmessage(handler) {
        this._eventTarget.addEventListener('message', handler)
        this._open = true
    }

    postMessage(message, ports) {
        if (this._other) {
            const event = new Event('message')
            event.data = message
            event.ports = ports
            this._other.dispatchEvent(event)
        }
    }

    start() {
        this._open = true
    }
    close() {
        expect(this._open).toBe(true)
        this._open = false
        this._other = null
    }
}

/**
 * A fake MessageChannel implementation.
 * When using a MessageChannel to communicate with a worker,
 * an event handler is hooked to port1 to get replies, and port2
 * is transferred to the worker, which then uses postMessage on it to
 * reply. So postMessage on port2 fires port1's event handler, and
 * vice versa.
 */
class MessageChannel {
    constructor() {
        this.port1 = new MessagePort()
        this.port2 = new MessagePort(this.port1)
        this.port1.other = this.port2
    }
}

// Expose our mock MessageChannel implementation
window.MessageChannel = MessageChannel

const randomInt = (max) => Math.floor(Math.random() * Math.floor(max))

const sandbox = sinon.sandbox.create()

let activeFakeWorker

beforeEach(() => {
    // Jest/JSDom doesn't provide a service worker
    expect(navigator.serviceWorker).toBeUndefined()

    // Fake ServiceWorker
    activeFakeWorker = {
        postMessage: sandbox.stub()
    }

    // Fake ServiceWorkerRegistration
    const swRegistration = {
        active: activeFakeWorker
    }

    // Fake ServiceWorkerContainer
    navigator.serviceWorker = {
        controller: activeFakeWorker,
        ready: Promise.resolve(swRegistration)
    }

    // Spy on addEventListener so that we can track calls.
    sandbox.spy(window, 'addEventListener')
})

afterEach(() => {
    delete navigator.serviceWorker
    activeFakeWorker = null
    sandbox.restore()
    DownloadManager.reset()
    Logger.setDebug(false)
})

test('Configures DownloadTracker via message', () => {
    const maxDownloads = randomInt(9) + 1
    const priorityFilters = []
    for (let i = 0; i < randomInt(5); i++) {
        priorityFilters.push({})
    }

    const manager = DownloadManager.getManager()

    manager.maxDownloads = maxDownloads
    manager.priorityFilters = priorityFilters

    const expectedReply = {
        command: CONFIGURED_THROTTLING,
        throttling: true,
        maxDownloads,
        priorityFilters
    }

    // Hook up a listener so that we get the configuration message
    // that would be posted to the worker, and send a reply.
    activeFakeWorker.postMessage = (message, ports) => {
        expect(message).toBeDefined()
        expect(message.command).toBe(CONFIGURE_THROTTLING)
        expect(message.maxDownloads).toBe(maxDownloads)
        expect(manager.maxDownloads).toBe(maxDownloads)
        expect(message.debug).toBe(Logger.isDebug())

        // The download manager may have prepended some default filters
        const expectedFilters = DownloadManager.defaultPriorityFilters.concat(priorityFilters)
        expect(message.priorityFilters).toEqual(expectedFilters)

        expect(ports).toBeDefined()
        expect(ports.length).toBe(1)

        // Send the expected reply.
        ports[0].postMessage(expectedReply)
    }

    // configure() returns a Promise that resolves
    // when the worker is configured and replies.
    return manager.configure().then((configured) => {
        expect(configured).toBeTruthy()
    })
})

test('Handles missing priorityFilters', () => {
    const manager = DownloadManager.getManager()
    manager.priorityFilters = undefined
    expect(manager.priorityFilters).toEqual(DownloadManager.defaultPriorityFilters)
})

test('Handles missing maxDownloads', () => {
    const manager = DownloadManager.getManager()
    manager.maxDownloads = undefined
    expect(manager.maxDownloads).toBe(0)
})

test('Handles missing service worker', () => {
    delete navigator.serviceWorker
    const manager = DownloadManager.getManager()
    return manager.configure().then((configured) => {
        expect(configured).toBeFalsy()
    })
})

test('Handles isServerSide', () => {
    window.Progressive = window.Progressive || {}
    window.Progressive.isServerSide = true

    delete navigator.serviceWorker
    const manager = DownloadManager.getManager()
    return manager
        .configure()
        .then((configured) => {
            expect(configured).toBeFalsy()
        })
        .finally(() => {
            delete window.Progressive
        })
})

test('Handles no service worker controller', () => {
    navigator.serviceWorker.ready = Promise.resolve({})
    const manager = DownloadManager.getManager()
    return manager.configure().then((configured) => {
        expect(configured).toBeFalsy()
    })
})

test('Handles no active service worker', () => {
    navigator.serviceWorker.controller = {}
    navigator.serviceWorker.ready = Promise.resolve({})
    const manager = DownloadManager.getManager()
    return manager.configure().then((configured) => {
        expect(configured).toBeFalsy()
    })
})

test('Ignores unrecognized message', (done) => {
    activeFakeWorker.postMessage = (message, ports) => {
        // Send an unrecognized reply..
        ports[0].postMessage({})
        done()
    }
    const manager = DownloadManager.getManager()
    manager.configure().then((configured) => {
        expect(configured).toBeTruthy()
    })
})

test('Relays messages as events', (done) => {
    let expectedEventIndex = 0

    const dmReadyEventListener = (event) => {
        expect(event.type).toEqual(DownloadManager.PWADownloadManagerReadyEvent)
        expectedEventIndex += 1
        if (expectedEventIndex >= 3) {
            removeEventListener(DownloadManager.PWADownloadManagerReadyEvent, dmReadyEventListener)
            done()
        }
    }

    const networkEventListener = (event) => {
        expect(event.type).toEqual(DownloadManager.PWANetworkEvent)
        expectedEventIndex += 1
        if (expectedEventIndex >= 3) {
            removeEventListener(DownloadManager.PWANetworkEvent, networkEventListener)
            done()
        }
    }

    addEventListener(DownloadManager.PWADownloadManagerReadyEvent, dmReadyEventListener)
    addEventListener(DownloadManager.PWANetworkEvent, networkEventListener)

    activeFakeWorker.postMessage = (message, ports) => {
        // Send a reply.
        ports[0].postMessage({
            command: CONFIGURED_THROTTLING
        })

        // Send an empty event
        ports[0].postMessage()

        // Send two network-busy status events
        ports[0].postMessage({
            command: NETWORK_BUSY_STATUS,
            networkBusy: true
        })
        ports[0].postMessage({
            command: NETWORK_BUSY_STATUS,
            networkBusy: false
        })
    }

    const manager = DownloadManager.getManager()
    manager.configure().then((configured) => {
        expect(configured).toBeTruthy()
    })
})
