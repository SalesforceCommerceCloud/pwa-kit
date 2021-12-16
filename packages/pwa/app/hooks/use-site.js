/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {convertToFullyQualifiedUrl} from '../utils/utils'
import {useLocation} from 'react-router-dom'
import {resolveSiteFromUrl} from '../utils/site-utils'

const useSite = () => {
    const {pathname, search} = useLocation()
    const url = convertToFullyQualifiedUrl(`${pathname}${search}`)
    const site = resolveSiteFromUrl(url)
    return site
}
export default useSite
