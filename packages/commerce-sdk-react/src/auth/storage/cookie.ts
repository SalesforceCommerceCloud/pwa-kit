/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import Cookies from 'js-cookie'
import {getCookieSameSiteAttribute, onClient} from '../../utils'
import {BaseStorage} from './base'

/**
 * A normalized implementation for Cookie store. It implements the BaseStorage interface
 * which allows developers to easily switch between Cookie, LocalStorage, Memory store
 * or a customized storage. This class is mainly used for commerce-sdk-react library
 * to store authentication tokens.
 */
export class CookieStorage extends BaseStorage {
    static available = typeof document !== 'undefined'
    set(key: string, value: string, options?: Cookies.CookieAttributes) {
        const suffixedKey = this.getSuffixedKey(key)

        Cookies.set(suffixedKey, value, {
            // Deployed sites will always be HTTPS, but the local dev server is served over HTTP.
            // Ideally, this would be `secure: true`, because Chrome and Firefox both treat
            // localhost as a Secure context. But Safari doesn't, so here we are.
            secure: !onClient() || window.location.protocol === 'https:',
            // By default, Chromes does not allow cookies to be sent/read
            // when the code is loaded in iframe (e.g storefront preview case)
            // setting sameSite to none lose that restriction to
            // make sure that cookies can be read/sent when code is loaded in an iframe of a certain allow host list.
            // Outside of iframe, we want to keep most browser default value (Chrome or Firefox uses Lax)
            // https://web.dev/samesite-cookie-recipes/
            sameSite: getCookieSameSiteAttribute(),
            ...options
        })
    }
    get(key: string) {
        const suffixedKey = this.getSuffixedKey(key)
        return Cookies.get(suffixedKey) || ''
    }
    delete(key: string) {
        const suffixedKey = this.getSuffixedKey(key)
        Cookies.remove(suffixedKey)
    }
}
