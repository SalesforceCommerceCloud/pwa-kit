/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import type Auth from '../auth'
import useAuthContext from './useAuthContext'
import useCookie from './useCookie'
import useLocalStorage from './useLocalStorage'
import useConfig from './useConfig'
import {onClient} from '../utils'

type AuthDataKey = Parameters<Auth['get']>[0]

/**
 * Reads a SLAS auth-data value with the right reactive source depending on
 * environment and the `enableHttpOnlySessionCookies` config flag:
 *
 * - SSR: reads from the auth context's in-memory store via `auth.get`.
 * - Client + httpOnly on: reads the proxy-set cookie (`<key>_<siteId>`).
 * - Client + httpOnly off: reads localStorage (`<key>_<siteId>`).
 *
 * Use this only for keys that the SLAS proxy mirrors as cookies in httpOnly
 * mode (customer_id, customer_type, enc_user_id, ...). For non-mirrored keys
 * like `uido`, read directly via `useLocalStorage` / `auth.get` instead.
 *
 * @internal
 */
function useAuthDataValue(key: AuthDataKey): string | null {
    const config = useConfig()
    const auth = useAuthContext()

    if (!onClient()) {
        return auth.get(key)
    }

    const storageKey = `${key}_${config.siteId}`
    // `enableHttpOnlySessionCookies` is set at provider mount and stable for
    // the lifetime of the process, so the conditional hook calls below cannot
    // violate the rules of hooks.
    /* eslint-disable react-hooks/rules-of-hooks */
    return config.enableHttpOnlySessionCookies ? useCookie(storageKey) : useLocalStorage(storageKey)
    /* eslint-enable react-hooks/rules-of-hooks */
}

export default useAuthDataValue
