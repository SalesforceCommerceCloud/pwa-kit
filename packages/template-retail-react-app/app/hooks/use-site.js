/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {SiteContext} from '../contexts'

/**
 * Custom React hook to get the current site
 * @returns {site: Object, setSite: function}
 */
const useSite = () => useContext(SiteContext)

export default useSite
