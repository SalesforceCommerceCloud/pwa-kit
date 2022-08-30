/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {PageRequestContext, PageResponseContext} from '../contexts'

export const usePageRequest = () => useContext(PageRequestContext)
export const usePageResponse = () => useContext(PageResponseContext)
