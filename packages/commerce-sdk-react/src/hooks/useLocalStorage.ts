/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect, useState, useCallback, useSyncExternalStore} from 'react'

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
    };

    const getLocalStorageServerSnapshot = () => {
        throw Error("useLocalStorage is a client-only hook");
    };

    // function dispatchStorageEvent(newValue: Value) {
    //     window.dispatchEvent(new StorageEvent("storage", { key, newValue }));
    // }

    const getSnapshot = () => readValue();

    const store: Value = useSyncExternalStore(
        useLocalStorageSubscribe,
        getSnapshot,
        getLocalStorageServerSnapshot
    );

    // const setStoredValue = useCallback(() => {
    //     try {
    //         const nextState = readValue()
    //         if (nextState === null) {
    //             window.localStorage.removeItem(key);
    //         } else {
    //             window.localStorage.setItem(key, nextState);
    //         }
    //     } catch (e) {
    //         console.warn(e);
    //     }
    // }, [key, store])

    // const handleStorageChange = (event: StorageEvent) => {
    //     if (event.key !== key) {
    //         return
    //     }
    //     setStoredValue()
    // }

    // const [storedValue, setStoredValue] = useState<Value>(readValue)

    return store
}

export default useLocalStorage
