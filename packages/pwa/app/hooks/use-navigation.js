/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCallback} from 'react'
import {useHistory} from 'react-router'
import {useIntl} from 'react-intl'
import {homeUrlBuilder} from '../utils/url'
import {useSiteAlias} from './use-site-alias'

/**
 * A convenience hook for programmatic navigation uses history's `push` or `replace`. The proper locale
 * is automatically prepended to the provided path. Additional args are passed through to `history`.
 * @returns {function} - Returns a navigate function that passes args to history methods.
 */
const useNavigation = () => {
    const history = useHistory()
    const {locale} = useIntl()
    const siteAlias = useSiteAlias()
    return useCallback(
        /**
         *
         * @param {string} path - path to navigate to
         * @param {('push'|'replace')} action - which history method to use
         * @param  {...any} args - additional args passed to `.push` or `.replace`
         */
        (path, action = 'push', ...args) => {
            const basePath = `/${siteAlias}/${locale}`
            const localizedHref = path && path.includes(basePath) ? path : `${basePath}${path}`
            history[action](
                path === '/' ? homeUrlBuilder('/', locale, siteAlias) : localizedHref,
                ...args
            )
        },
        [locale]
    )
}

export default useNavigation
