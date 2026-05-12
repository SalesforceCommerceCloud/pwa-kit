/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect, useCallback} from 'react'
import Cookies from 'js-cookie'
import {COOKIE_CHANGE_EVENT, CookieChangeDetail} from '../auth/storage/cookie'

type Value = string | null

const readValue = (key: string): Value => {
    if (typeof document === 'undefined') {
        return null
    }
    const value = Cookies.get(key)
    return value === undefined ? null : value
}

/* eslint-disable react-hooks/rules-of-hooks */
// The presence of useSyncExternalStore is determined by the bundled React
// version and is stable for the lifetime of the process, so the conditional
// hook calls below cannot violate the rules of hooks.
/**
 * Reads a cookie by name and re-renders when its value changes. Subscribes to
 * the `COOKIE_CHANGE_EVENT` dispatched by `CookieStorage.set`/`.delete`, which
 * gives us synchronous in-tab updates equivalent to `StorageEvent` for
 * localStorage. There is no polling, so cookies set outside the SDK
 * (cross-tab writes, server-set Set-Cookie headers without an accompanying
 * React state change) only reflect on the next render the component performs
 * for other reasons — in practice that re-render is triggered by the same
 * auth flow that produced the cookie.
 *
 * @internal
 */
function useCookie(key: string): Value {
    const useSyncExternalStore = (React as any).useSyncExternalStore

    if (useSyncExternalStore) {
        const subscribe = useCallback(
            (callback: () => void) => {
                const handler = (event: Event) => {
                    const {detail} = event as CustomEvent<CookieChangeDetail>
                    if (detail?.key === key) callback()
                }
                window.addEventListener(COOKIE_CHANGE_EVENT, handler)
                return () => window.removeEventListener(COOKIE_CHANGE_EVENT, handler)
            },
            [key]
        )
        const getSnapshot = useCallback(() => readValue(key), [key])
        const getServerSnapshot = useCallback(() => null, [])

        return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
    }

    // React 17 fallback
    const [value, setValue] = useState<Value>(() => readValue(key))

    useEffect(() => {
        setValue(readValue(key))
        const handler = (event: Event) => {
            const {detail} = event as CustomEvent<CookieChangeDetail>
            if (detail?.key === key) setValue(readValue(key))
        }
        window.addEventListener(COOKIE_CHANGE_EVENT, handler)
        return () => window.removeEventListener(COOKIE_CHANGE_EVENT, handler)
    }, [key])

    return value
}
/* eslint-enable react-hooks/rules-of-hooks */

export default useCookie
