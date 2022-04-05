/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import useSite from './use-site'
import {useMemo} from 'react'
import {resolveLocaleFromUrl} from '../utils/utils'
import {useLocation} from 'react-router-dom'

/**
 * This hook returns the locale object based on current location
 * @return {object} locale
 */
const useLocale = () => {
    const {pathname, search} = useLocation()
    const site = useSite()
    const locale = useMemo(() => {
        return resolveLocaleFromUrl(`${pathname}${search}`)
    }, [pathname, search, site])

    return locale
}

export default useLocale
