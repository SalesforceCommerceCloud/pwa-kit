/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useMemo} from 'react'
import {useLocation} from 'react-router-dom'
import {resolveConfigFromPath} from '../utils/url-config'

/**
 * This hook returns the current config values based on current location
 * @return {object} - {{site: string, locale: string, url: {locale: string, site: string}}} config values object
 */
const useConfigValues = () => {
    const {pathname, search} = useLocation()
    const configValues = useMemo(() => {
        return resolveConfigFromPath(`${pathname}${search}`)
    }, [pathname, search])
    return configValues
}

export default useConfigValues
