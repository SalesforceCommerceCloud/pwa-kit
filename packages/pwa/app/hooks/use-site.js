/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {resolveSiteFromUrl} from '../utils/utils'
import {useLocation} from 'react-router-dom'

const useSite = () => {
    const {pathname, search} = useLocation()
    const url = `${pathname}${search}`
    const site = resolveSiteFromUrl(url)
    return site
}
export default useSite
