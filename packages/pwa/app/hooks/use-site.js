/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useLocation} from 'react-router-dom'
import {resolveSiteFromUrl} from '../utils/site-utils'
import {useMemo} from 'react'

/**
 * This hook returns the current site based on current location
 *
 * @returns {Object} - current site
 */
const useSite = () => {
    const {pathname, search} = useLocation()
    const site = useMemo(() => {
        return resolveSiteFromUrl(`${pathname}${search}`)
    }, [pathname, search])
    return site
}

export default useSite
