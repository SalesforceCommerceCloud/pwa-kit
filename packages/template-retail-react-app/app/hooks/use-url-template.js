/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {UrlTemplateContext} from '../contexts'

/**
 * Custom React hook to get the current site
 * @returns {site: Object, setSite: function}
 */
const useUrlTemplate = () => useContext(UrlTemplateContext)

export default useUrlTemplate
