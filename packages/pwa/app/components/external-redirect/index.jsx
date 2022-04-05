/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'

export const ExternalRedirect = ({to}) => {
    useEffect(() => {
        window.location = to
    }, [to])

    return null
}

export default ExternalRedirect
