/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {pathToUrl} from '../utils/utils'
import {useLocation} from 'react-router-dom'
import {resolveSiteFromUrl} from '../utils/site-utils'
import {useMemo} from 'react'

const useSite = () => {
    const {pathname, search} = useLocation()
    const site = useMemo(() => {
        return resolveSiteFromUrl(pathToUrl(`${pathname}${search}`))
    }, [pathname, search])
    return site
}

export default useSite
