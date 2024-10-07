/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useRef} from 'react'
export const usePrevious = (value) => {
    const ref = useRef()

    useEffect(() => {
        ref.current = value
    }, [value])

    return ref.current
}
