/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore file */

import React, {useContext} from 'react'
import {CorrelationIdContext} from '../contexts'

/**
 * Use this hook to get the correlation id value of the closest CorrelationIdProvider component.
 *
 * @returns {object} The correlation id
 */
export const useCorrelationId = () => {
    const context = React.useContext(CorrelationIdContext)
    if (context === undefined) {
        throw new Error('useCorrelationId needs to be used within CorrelationIdProvider')
    }
    return context
}
