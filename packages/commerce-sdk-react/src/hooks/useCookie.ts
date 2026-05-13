/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Cookies from 'js-cookie'

type Value = string | null

/**
 * Reads a cookie by name on every render. There is no subscription, so the
 * value only refreshes when the consuming component re-renders for some other
 * reason (state change, auth flow, navigation). In practice the relevant
 * cookies are set by the SLAS proxy as a side effect of token responses, and
 * those responses already trigger React state updates that propagate to
 * consumers. Cross-tab cookie changes are not picked up automatically — see
 * the PR description for the trade-off.
 *
 * @internal
 */
function useCookie(key: string): Value {
    if (typeof document === 'undefined') return null
    const value = Cookies.get(key)
    return value === undefined ? null : value
}

export default useCookie
