/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {UrlTemplateContext} from '../contexts'

/**
 * Custom React hook to get the function that generates URLs following the App configuration.
 * @returns {fillUrlTemplate: function}
 */
const useUrlTemplate = () => {
    const context = useContext(UrlTemplateContext)
    if (context === undefined) {
        throw new Error('useUrlTemplate must be used within UrlTemplateProvider')
    }
    return context
}

export default useUrlTemplate
