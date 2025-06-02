/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useCallback} from 'react'
import {toaster} from '../components/toaster'

/**
 * This is a convenient hook that returns a function for creating toasts.
 *
 * It's a wrapper around the Ark UI `toaster.create` method.
 * See https://ark-ui.com/docs/components/toast
 *
 * @example
 * const toast = useToast()
 * toast({
 *     title: 'Hello',
 *     description: 'World',
 *     type: 'success',
 *     action: <Button>Click me</Button>
 * })
 *
 * @returns {Function} - A function for creating toasts.
 */
export default function useToast() {
    const createToast = useCallback((options) => {
        return toaster.create(options)
    }, [])

    return createToast
}
