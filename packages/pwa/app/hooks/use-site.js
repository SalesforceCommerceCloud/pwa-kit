/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useMemo} from 'react'
import {useLocation} from 'react-router-dom'
import {urlToPath} from '../utils/url'
import {resolveSiteFromUrl} from '../utils/site-utils'

/**
 * This hook returns the site configuration object using the site identifier
 * (id or alias) in the current url.
 *
 * @returns {Object} The site configuration object
 */
const useSite = () => {
    const {pathname, search} = useLocation()
    let site

    useMemo(() => {
        const url = urlToPath(`${pathname}${search}`)
        site = resolveSiteFromUrl(url)
    }, [pathname, search])

    return site
}

export default useSite
