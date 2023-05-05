/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useState, useEffect} from 'react'

/**
 * Hook to determine if the code is hydrated
 * Solution for hydration issues with SSR.
 * @returns {boolean} true if the code is finished hydration
 */
export const useIsHydrated = () => {
    const [isHydrated, setIsHydrated] = useState(false)

    useEffect(() => {
        setIsHydrated(true)
    }, [])

    return isHydrated
}
