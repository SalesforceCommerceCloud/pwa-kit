/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import useConfig from '../useConfig'
import {PageDesignerParams} from '../../provider'

/**
 * Hook to get Page Designer query parameters (mode, pdToken).
 * These parameters are used when previewing pages in Page Designer edit mode.
 *
 * The parameters should be passed to CommerceApiProvider via the `pageDesignerParams` prop,
 * extracted from the request URL on the server side for SSR compatibility.
 *
 * @returns An object containing mode and pdToken if provided to the CommerceApiProvider
 */
export const usePageDesignerParams = (): PageDesignerParams => {
    const config = useConfig()
    return config.pageDesignerParams || {}
}
