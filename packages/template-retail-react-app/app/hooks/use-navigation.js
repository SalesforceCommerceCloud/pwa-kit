/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCallback} from 'react'
import {useHistory} from 'react-router'
import useMultiSite from './use-multi-site'
import {removeSiteLocaleFromPath} from '../utils/url'

const keepParams = ['vse', 'pagevse', 'vse-timestamp']

export const keepVse = (search, url) => {
    // Break down the given path and try to keep vse params.
    if (url == null) {
        return url
    }

    const paramIndex = url.indexOf('?')
    const activeParams = new URLSearchParams(search)

    const params =
        paramIndex === -1 ? new URLSearchParams() : new URLSearchParams(url.substring(paramIndex))

    let changedAny = false
    for (let key of keepParams) {
        if (!params.has(key) && activeParams.has(key)) {
            params.set(key, activeParams.get(key))
            changedAny = true
        }
    }

    if (!changedAny) {
        return url
    }

    return (paramIndex === -1 ? url : url.substring(0, paramIndex)) + '?' + params.toString()
}

/**
 * A convenience hook for programmatic navigation uses history's `push` or `replace`. The proper locale
 * is automatically prepended to the provided path. Additional args are passed through to `history`.
 * @returns {function} - Returns a navigate function that passes args to history methods.
 */
const useNavigation = () => {
    const history = useHistory()

    const {site, locale: localeShortCode, buildUrl} = useMultiSite()

    return useCallback(
        /**
         *
         * @param {string} path - path to navigate to
         * @param {('push'|'replace')} action - which history method to use
         * @param  {...any} args - additional args passed to `.push` or `.replace`
         */
        (path, action = 'push', ...args) => {
            if (path == null) {
                history[action](history.location.pathname + history.location.search, ...args)
            } else {
                const dest = keepVse(
                    history.location.search,
                    path === '/' ? '/' : buildUrl(removeSiteLocaleFromPath(path))
                )
                history[action](dest, ...args)
            }
        },
        [localeShortCode, site]
    )
}

export default useNavigation
