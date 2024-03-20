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
 *
 */
function useLocalStorage(key: string): Value {
    const readValue = (): Value => {
        // TODO: Use detectLocalStorageAvailable when app can better handle clients without storage
        if (typeof window === 'undefined') {
            return null
        }

        return window.localStorage.getItem(key)
    }

    const useLocalStorageSubscribe = (callback: any) => {
        window.addEventListener('storage', callback)
        return () => window.removeEventListener('storage', callback)
    }

    const getLocalStorageServerSnapshot = () => {
        // local store is not available on the server
        return null
    }

    const getLocalStorageSnapshot = () => readValue()

    const store: Value = useSyncExternalStore(
        useLocalStorageSubscribe,
        getLocalStorageSnapshot,
        getLocalStorageServerSnapshot
    )

    return store
}

export default useLocalStorage
