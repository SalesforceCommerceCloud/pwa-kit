/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect, useCallback, useRef} from 'react'
import Cookies from 'js-cookie'

type Value = string | null

const POLL_INTERVAL_MS = 1000

/**
 * @internal
 */
const readValue = (key: string): Value => {
    if (typeof document === 'undefined') {
        return null
    }
    const value = Cookies.get(key)
    return value === undefined ? null : value
}

/* eslint-disable react-hooks/rules-of-hooks */
/**
 * Reads a cookie by name and re-renders when its value changes. Cookies do not
 * fire DOM events on change, so this hook polls `document.cookie` on an
 * interval to detect updates from other tabs or server-set Set-Cookie headers.
 *
 * @internal
 */
function useCookie(key: string): Value {
    const useSyncExternalStore = (React as any).useSyncExternalStore

    if (useSyncExternalStore) {
        const lastValueRef = useRef<Value>(readValue(key))

        const subscribe = useCallback(
            (callback: () => void) => {
                const intervalId = window.setInterval(() => {
                    const current = readValue(key)
                    if (current !== lastValueRef.current) {
                        lastValueRef.current = current
                        callback()
                    }
                }, POLL_INTERVAL_MS)
                return () => window.clearInterval(intervalId)
            },
            [key]
        )

        const getSnapshot = useCallback(() => {
            const current = readValue(key)
            lastValueRef.current = current
            return current
        }, [key])
        const getServerSnapshot = useCallback(() => null, [])

        return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
    }

    // React 17 fallback
    const [value, setValue] = useState<Value>(() => readValue(key))

    useEffect(() => {
        setValue(readValue(key))
        const intervalId = window.setInterval(() => {
            const current = readValue(key)
            setValue((prev) => (prev === current ? prev : current))
        }, POLL_INTERVAL_MS)
        return () => window.clearInterval(intervalId)
    }, [key])

    return value
}
/* eslint-enable react-hooks/rules-of-hooks */

export default useCookie
