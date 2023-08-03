/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext, createContext} from 'react'

export const SelectedItemContext = createContext(undefined)
export const useSelectedItem = () => useContext(SelectedItemContext)
