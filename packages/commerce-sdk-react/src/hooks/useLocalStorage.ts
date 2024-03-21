/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useSyncExternalStore} from 'react'

type Value = string | null

/**
 * @internal
 */
const readValue = (key: string): Value => {
    // TODO: Use detectLocalStorageAvailable when app can better handle clients without storage
    if (typeof window === 'undefined') {
        return null
    }
    return window.localStorage.getItem(key)
}

/**
 * @internal
 */
const subscribeToLocalStorage = (callback: any) => {
    window.addEventListener('storage', callback)
    return () => window.removeEventListener('storage', callback)
}

/**
 * @internal
 */
const getLocalStorageServerSnapshot = () => {
    // local storage is not available on the server
    return null
}

/**
 * @internal
 */
function useLocalStorage(key: string): Value {
    const getLocalStorageSnapshot = () => readValue(key)

    const store: Value = useSyncExternalStore(
        subscribeToLocalStorage,
        getLocalStorageSnapshot,
        getLocalStorageServerSnapshot
    )

    return store
}

export default useLocalStorage
