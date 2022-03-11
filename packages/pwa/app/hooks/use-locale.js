/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useIntl} from 'react-intl'
import useSite from './use-site'
import {useMemo} from 'react'
import {getLocaleFromSite} from '../utils/utils'

/**
 * This hook returns the locale object based on current locale shortCode and current site
 * @return {object} locale
 */
const useLocale = () => {
    const {locale: localeShortCode} = useIntl()
    const site = useSite()
    const locale = useMemo(() => {
        return getLocaleFromSite(site, localeShortCode)
    }, [localeShortCode, site])

    return locale
}

export default useLocale
