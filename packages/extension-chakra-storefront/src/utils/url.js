/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export const categoryUrlBuilder = (category) => {
    if (!category) return '/'
    
    const categoryId = category.id || category.categoryId
    const categoryName = category.name || category.title
    
    if (categoryId) {
        return `/category/${categoryId}`
    }
    
    if (categoryName) {
        return `/category/${categoryName.toLowerCase().replace(/\s+/g, '-')}`
    }
    
    return '/'
} 