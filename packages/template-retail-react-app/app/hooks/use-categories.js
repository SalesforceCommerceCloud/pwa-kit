/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useContext} from 'react'
import {CategoriesContext} from '../contexts'

/**
 * Custom React hook to get the categories
 * @returns {{categories: Object, setCategories: function}[]}
 */
export const useCategories = () => useContext(CategoriesContext)
