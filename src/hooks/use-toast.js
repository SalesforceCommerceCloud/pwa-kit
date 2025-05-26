/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { useCallback } from 'react'
import { toaster } from '../components/toaster'

export default function useToast() {
    const toast = useCallback((options) => {
        return toaster.create(options)
    }, [])

    return toast
}