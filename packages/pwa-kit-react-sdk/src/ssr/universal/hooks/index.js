/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */

import {useContext} from 'react'
import {CorrelationIdContext, ExpressContext} from '../contexts'

export const useExpress = () => {
    return useContext(ExpressContext)
}

export const useCorrelationId = () => {
    return useContext(CorrelationIdContext)
}
