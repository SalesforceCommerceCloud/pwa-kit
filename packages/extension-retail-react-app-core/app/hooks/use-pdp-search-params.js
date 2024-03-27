/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useLocation} from 'react-router-dom'

export const usePDPSearchParams = (productId) => {
    const {search} = useLocation()

    const allParams = new URLSearchParams(search)
    const productParams = new URLSearchParams(allParams.get(productId) || '')

    return [allParams, productParams]
}
