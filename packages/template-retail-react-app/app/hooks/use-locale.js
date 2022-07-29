/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {LocaleContext} from '../contexts'

/**
 * Custom React hook to get the locale
 * @returns {locale: Object, setLocale: function}
 */
const useLocale = () => {
    const context = useContext(LocaleContext)
    if (context === undefined) {
        throw new Error('useLocale must be used within LocaleProvider')
    }
    return context
}
export default useLocale
