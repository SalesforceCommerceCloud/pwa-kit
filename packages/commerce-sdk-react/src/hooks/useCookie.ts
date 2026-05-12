/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect, useCallback} from 'react'
import Cookies from 'js-cookie'

type Value = string | null

const POLL_INTERVAL_MS = 1000

/**
 * Module-level cookie watcher. We poll `document.cookie` once per interval
 * and fan out to per-key subscribers, so the cost is one timer per process
 * regardless of how many components mount `useCookie`.
 *
 * Cookies do not fire DOM events on change, so polling is the simplest
 * cross-tab change-detection mechanism. A future refactor could replace this
 * with `BroadcastChannel` or piggyback on auth-state events.
 */
const subscribers = new Map<string, Set<() => void>>()
const lastValues = new Map<string, Value>()
let pollIntervalId: ReturnType<typeof setInterval> | null = null

const readValue = (key: string): Value => {
    if (typeof document === 'undefined') {
        return null
    }
    const value = Cookies.get(key)
    return value === undefined ? null : value
}

const tick = () => {
    for (const [key, callbacks] of subscribers) {
        const current = readValue(key)
        if (current !== lastValues.get(key)) {
            lastValues.set(key, current)
            callbacks.forEach((cb) => cb())
        }
    }
}

const subscribe = (key: string, callback: () => void) => {
    let callbacks = subscribers.get(key)
    if (!callbacks) {
        callbacks = new Set()
        subscribers.set(key, callbacks)
        lastValues.set(key, readValue(key))
    }
    callbacks.add(callback)

    if (pollIntervalId === null && typeof window !== 'undefined') {
        pollIntervalId = setInterval(tick, POLL_INTERVAL_MS)
    }

    return () => {
        const callbacks = subscribers.get(key)
        if (!callbacks) return
        callbacks.delete(callback)
        if (callbacks.size === 0) {
            subscribers.delete(key)
            lastValues.delete(key)
        }
        if (subscribers.size === 0 && pollIntervalId !== null) {
            clearInterval(pollIntervalId)
            pollIntervalId = null
        }
    }
}

/* eslint-disable react-hooks/rules-of-hooks */
// The presence of useSyncExternalStore is determined by the bundled React
// version and is stable for the lifetime of the process, so the conditional
// hook calls below cannot violate the rules of hooks.
/**
 * Reads a cookie by name and re-renders when its value changes. Subscribers
 * share a single module-level poll loop (see notes above) so adding extra
 * components does not multiply the timer cost.
 *
 * @internal
 */
function useCookie(key: string): Value {
    const useSyncExternalStore = (React as any).useSyncExternalStore

    if (useSyncExternalStore) {
        const subscribeToKeyChanges = useCallback(
            (callback: () => void) => subscribe(key, callback),
            [key]
        )

        const getSnapshot = useCallback(() => readValue(key), [key])
        const getServerSnapshot = useCallback(() => null, [])

        return useSyncExternalStore(subscribeToKeyChanges, getSnapshot, getServerSnapshot)
    }

    // React 17 fallback
    const [value, setValue] = useState<Value>(() => readValue(key))

    useEffect(() => {
        setValue(readValue(key))
        return subscribe(key, () => setValue(readValue(key)))
    }, [key])

    return value
}
/* eslint-enable react-hooks/rules-of-hooks */

export default useCookie
