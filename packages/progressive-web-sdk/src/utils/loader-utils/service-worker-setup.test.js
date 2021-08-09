/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {
    updateMessagingSWVersion,
    messagingSWVersionKey,
    messagingSWUpdateKey,
    getMessagingSWVersion,
    loadWorker,
    preloadSWAmp,
    getServiceWorkerURL
} from './service-worker-setup'

console.warn = jest.fn()
afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
})

test('updateMessagingSWVersion sets localStorage if versionData available', () => {
    const swTestVersion = 'test-version'
    const swTestHash = 'test-hash'

    fetch.mockReturnValue(
        Promise.resolve({
            json: () => ({
                SERVICE_WORKER_CURRENT_VERSION: swTestVersion,
                SERVICE_WORKER_CURRENT_HASH: swTestHash
            })
        })
    )

    return updateMessagingSWVersion().then(() => {
        expect(localStorage.getItem(messagingSWVersionKey)).toBe(`${swTestVersion}_${swTestHash}`)
    })
})

test('updateMessagingSWVersion sets flag in sessionStorage', () => {
    fetch.mockReturnValue(
        Promise.resolve({
            json: () => undefined
        })
    )

    return updateMessagingSWVersion().then(() => {
        expect(sessionStorage.getItem(messagingSWUpdateKey)).toBe('checked')
    })
})

test('updateMessagingSWVersion returns the version data if local storage is unavailable', () => {
    const testVersionData = {
        SERVICE_WORKER_CURRENT_VERSION: 'test-hash',
        SERVICE_WORKER_CURRENT_HASH: 'test-hash'
    }
    fetch.mockReturnValue(
        Promise.resolve({
            json: () => testVersionData
        })
    )

    jest.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('Unsupported')
    })

    expect.assertions(2)

    return updateMessagingSWVersion().then((versionData) => {
        expect(versionData).toEqual(testVersionData)
        expect(localStorage.setItem).toHaveBeenCalled()

        // restore localStorage.setItem implementation
        jest.spyOn(localStorage, 'setItem').mockImplementation((k, v) => {
            localStorage.__STORE__[k] = v.toString()
        })
    })
})

test('updateMessagingSWVersion logs an error', () => {
    jest.spyOn(console, 'log')
    fetch.mockReturnValue(
        Promise.resolve({
            json: () => Promise.reject(new Error('JSON decode failed'))
        })
    )
    expect.assertions(1)
    return updateMessagingSWVersion().then(() => {
        expect(console.log).toHaveBeenCalledWith(Error('JSON decode failed'))
    })
})

test('getMessagingSWVersion returns nothing if local storage unavailable', () => {
    // const originalGetItem = localStorage.getItem
    localStorage.getItem.mockImplementationOnce(() => {
        return undefined
    })

    const messagingSWVersion = getMessagingSWVersion()

    expect(messagingSWVersion).toBe('')
})

test('getMessagingSWVersion calls updateMessagingSWVersion if messagingSWUpdateKey is not in sessionStorage', () => {
    fetch.mockResponse(JSON.stringify({}))
    getMessagingSWVersion()

    expect(fetch).toHaveBeenCalledWith(
        'https://webpush-cdn.mobify.net/pwa-serviceworker-version.json'
    )
})

test('getMessagingSWVersion returns a service worker version stored in local storage', () => {
    sessionStorage.setItem(messagingSWUpdateKey, 'checked')
    localStorage.setItem(messagingSWVersionKey, 'test-version')

    expect(getMessagingSWVersion()).toBe('test-version')
})

test('loadWorker registers the service worker from the URL found in local storage', () => {
    const testURL = 'https://www.mobify.com'
    navigator.serviceWorker = {
        register: jest.fn()
    }
    localStorage.setItem('mobify-service-worker-loader-url', testURL)
    navigator.serviceWorker.register.mockReturnValue(Promise.resolve())

    loadWorker(true, true, {buildDate: '1234'})

    expect(navigator.serviceWorker.register).toHaveBeenCalledWith(testURL)
})

test('loadWorker logs an error when register fails with an error other than 410', () => {
    const testURL = 'https://www.mobify.com'
    console.error = jest.fn()
    navigator.serviceWorker = {
        register: jest.fn()
    }
    localStorage.setItem('mobify-service-worker-loader-url', testURL)
    navigator.serviceWorker.register.mockReturnValue(Promise.reject(new Error('Register Failed')))

    return loadWorker(true, true, {buildDate: '1234'}).then(() => {
        expect(console.error).toHaveBeenCalledWith(Error('Register Failed'))
    })
})

test('loadWorker retries registering the service worker when a 410 error is thrown', () => {
    const testURL = 'https://www.mobify.com/test.js'
    navigator.serviceWorker = {
        register: jest.fn()
    }
    localStorage.setItem('mobify-service-worker-loader-url', testURL)
    navigator.serviceWorker.register.mockReturnValueOnce(
        Promise.reject(new Error('410: Register Failed'))
    )

    return loadWorker(true, true, {buildDate: '1234'}).then(() => {
        expect(navigator.serviceWorker.register).toHaveBeenCalledWith(testURL.replace('.js', ''))
    })
})

test('loadWorker will register the worker if no URL is in local storage', () => {
    navigator.serviceWorker = {
        register: jest.fn()
    }
    sessionStorage.setItem(messagingSWUpdateKey, 'checked')
    localStorage.setItem(messagingSWVersionKey, 'test-version')
    window.Mobify = {}
    navigator.serviceWorker.register.mockReturnValue(Promise.resolve())

    loadWorker(true, true, {buildDate: '1234'})
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith(
        '/service-worker-loader.js?preview=true&buildOrigin=%2F%2F0.0.0.0%3A8443%2F&target=production&b=1234&pwa=1&msg_sw_version=test-version'
    )
})

test('loadWorker will load the worker from worker.js is skipLoader is set to true', () => {
    navigator.serviceWorker = {
        register: jest.fn()
    }
    sessionStorage.setItem(messagingSWUpdateKey, 'checked')
    localStorage.setItem(messagingSWVersionKey, 'test-version')
    window.Mobify = {}
    navigator.serviceWorker.register.mockReturnValue(Promise.resolve())

    loadWorker(true, true, {buildDate: '1234'}, true)
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith(
        '/worker.js?preview=true&buildOrigin=%2F%2F0.0.0.0%3A8443%2F&target=production&b=1234&pwa=1&msg_sw_version=test-version'
    )
})

test('preloadSWAmp loads service Worker when page URL is sw.html', () => {
    const testURL = 'https://www.mobify.com'
    // eslint-disable-next-line no-undef
    jsdom.reconfigure({
        url: `${testURL}/sw.html`
    })
    navigator.serviceWorker = {
        register: jest.fn().mockResolvedValue()
    }
    localStorage.setItem('mobify-service-worker-loader-url', testURL)

    preloadSWAmp()

    expect(navigator.serviceWorker.register).toHaveBeenCalled()
})

test('preloadSWAmp does not load service Worker when page URL is not sw.html', () => {
    const testURL = 'https://www.mobify.com'
    // eslint-disable-next-line no-undef
    jsdom.reconfigure({
        url: `${testURL}/test.html`
    })
    navigator.serviceWorker = {
        register: jest.fn().mockResolvedValue()
    }
    localStorage.setItem('mobify-service-worker-loader-url', testURL)

    preloadSWAmp(true, true, {buildDate: '1234'})

    expect(navigator.serviceWorker.register).not.toHaveBeenCalled()
})

test('getServiceWorkerURL sets PWA Mode to true in service Worker URL ', () => {
    const serviceWorkerURL = getServiceWorkerURL(true, false, {buildDate: '1234'})

    expect(serviceWorkerURL).toMatch(/&pwa=1/)
})

test('getServiceWorkerURL sets PWA Mode to false in service Worker URL ', () => {
    const serviceWorkerURL = getServiceWorkerURL(false, false, {buildDate: '1234'})

    expect(serviceWorkerURL).toMatch(/&pwa=0/)
})

test('getServiceWorkerURL sets Messaging Mode to false in service Worker URL ', () => {
    sessionStorage.setItem(messagingSWUpdateKey, 'checked')
    localStorage.setItem(messagingSWVersionKey, 'test-version')
    const serviceWorkerURL = getServiceWorkerURL(false, false, {buildDate: '1234'})

    expect(serviceWorkerURL).not.toMatch(/&msg_sw_version=test-version/)
})

test('getServiceWorkerURL sets service worker version if messaging is enabled in service Worker URL ', () => {
    sessionStorage.setItem(messagingSWUpdateKey, 'checked')
    localStorage.setItem(messagingSWVersionKey, 'test-version')
    const serviceWorkerURL = getServiceWorkerURL(false, true, {buildDate: '1234'})

    expect(serviceWorkerURL).toMatch(/&msg_sw_version=test-version/)
})

test('getServiceWorkerURL does not set service worker version in service Worker URL if messaging is enabled but no version is in storage', () => {
    sessionStorage.setItem(messagingSWUpdateKey, 'checked')
    const serviceWorkerURL = getServiceWorkerURL(false, true, {buildDate: '1234'})

    expect(serviceWorkerURL).not.toMatch(/&msg_sw_version=test-version/)
})

test('getMessagingSWVersion returns a service worker version stored in sessionStorage', () => {
    sessionStorage.setItem(messagingSWVersionKey, 'checked')

    expect(getMessagingSWVersion()).toBe('checked')
    sessionStorage.getItem.mockRestore()
})
