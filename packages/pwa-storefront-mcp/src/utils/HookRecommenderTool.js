/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {zodToJsonSchema} from 'zod-to-json-schema'
import {z} from 'zod'
import {EmptyJsonSchema} from './utils.js'

const hookRecommendations = {
    product: [
        {
            name: 'useProduct',
            description: 'Fetches details for a single product by its ID.',
            package: 'commerce-sdk-react'
        },
        {
            name: 'useProducts',
            description: 'Fetches a list of products, often used for categories or search results.',
            package: 'commerce-sdk-react'
        },
        {
            name: 'useProductSearch',
            description: 'Performs a search for products based on a query.',
            package: 'commerce-sdk-react'
        }
    ],
    category: [
        {
            name: 'useCategory',
            description: 'Fetches details for a single category by its ID.',
            package: 'commerce-sdk-react'
        },
        {
            name: 'useCategories',
            description: 'Fetches a list of categories.',
            package: 'commerce-sdk-react'
        }
    ],
    basket: [
        {
            name: 'useBasket',
            description: 'Fetches the current user basket.',
            package: 'commerce-sdk-react'
        },
        {
            name: 'useShopperBaskets',
            description:
                'Provides actions for managing baskets, like adding items or updating shipments.',
            package: 'commerce-sdk-react'
        }
    ],
    customer: [
        {
            name: 'useCustomer',
            description: 'Fetches details for the currently logged-in customer.',
            package: 'commerce-sdk-react'
        },
        {
            name: 'useCustomerBaskets',
            description: "Fetches all baskets associated with a customer's account.",
            package: 'commerce-sdk-react'
        }
    ]
}

export class HookRecommenderTool {
    getRecommendations(entity) {
        const lowerEntity = entity.toLowerCase()
        return (
            hookRecommendations[lowerEntity] || {
                error: `No hook recommendations found for entity: ${entity}`
            }
        )
    }
}
