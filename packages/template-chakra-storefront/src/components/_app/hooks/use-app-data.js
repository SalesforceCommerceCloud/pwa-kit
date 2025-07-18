/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCategory} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer, useCurrentBasket} from '../../../hooks'
import {flatten} from '../../../utils/utils'

/**
 * Custom hook for managing app-level data fetching
 * Handles categories tree, current customer, and current basket data
 *
 * @returns {Object} App data including categories, customer, and basket
 */
export const useAppData = () => {
    const {data: categoriesTree} = useCategory({
        parameters: {
            id: 'root',
            levels: 1
        }
    })

    const categories = flatten(categoriesTree || {}, 'categories')

    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()

    return {
        categoriesTree,
        categories,
        customer,
        basket
    }
}
