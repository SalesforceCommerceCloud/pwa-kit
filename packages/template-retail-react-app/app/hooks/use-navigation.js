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
            const updatedHref = buildUrl(removeSiteLocaleFromPath(path))
            history[action](path === '/' ? '/' : updatedHref, ...args)
        },
        [localeShortCode, site]
    )
}

export default useNavigation
