/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useSyncExternalStore} from 'use-sync-external-store/shim'
import {useCommerceAPI} from '../contexts'
import Cookies from 'js-cookie'

/**
 * @internal
 */
const readLocalStorageValue = (key) => {
    if (typeof window === 'undefined') {
        return null
    }
    return window.localStorage.getItem(key)
}

/**
 * @internal
 */
const subscribeToLocalStorage = (callback) => {
    window.addEventListener('storage', callback)
    return () => window.removeEventListener('storage', callback)
}

/**
 * @internal
 */
const readCookieStorageValue = (key) => {
    if (typeof document === 'undefined') {
        return null
    }
    return Cookies.get(key)
}

/**
 * @internal
 */
const subscribeToCookieStorage = (callback) => {
    console.log('event fired')
    window.addEventListener('change', callback)
    return () => window.removeEventListener('change', callback)
}

/**
 * @internal
 */
const getStorageServerSnapshot = () => {
    // local store and cookie store are not available on the server
    return null
}

/**
 * @internal
 */
function useStorage(key) {
    const api = useCommerceAPI()
    const storage = api.auth.storage

    // This conditional is a constant value based on the environment + what
    // is set in auth.js. Options are either local or cookie for client and
    // in memory for the server, so the same path will always be followed.
    if (storage.type() == 'local-store') {
        const getLocalStorageSnapshot = () => readLocalStorageValue(key)

        return useSyncExternalStore(
            subscribeToLocalStorage,
            getLocalStorageSnapshot,
            getStorageServerSnapshot
        )
    } else if (storage.type() == 'cookie-store') {
        const getCookieStorageSnapshot = () => readCookieStorageValue(key)

        return useSyncExternalStore(
            subscribeToCookieStorage,
            getCookieStorageSnapshot,
            getStorageServerSnapshot
        )
    } else if (storage.type() == 'memory-store') {
        return storage.get(key)
    } else {
        return null
    }
}

export default useStorage
