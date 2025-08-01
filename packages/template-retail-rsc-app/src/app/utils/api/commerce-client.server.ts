import 'server-only'

import type {ShopperProductsTypes, ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import type {SessionData} from '@/app/utils/api/commerce-api'
import {
    createShopperProductsClient,
    createShopperSearchClient
} from '@/app/utils/api/commerce-client'

export const fetchProductsGetCategory = (
    session: SessionData,
    parameters: {
        id: string | null
        levels?: number
    }
): Promise<ShopperProductsTypes.Category> => {
    const client = createShopperProductsClient(session)
    return client.getCategory({
        parameters: {
            ...parameters,
            id: parameters.id ?? ''
        }
    })
}

export const fetchSearchProducts = (
    session: SessionData,
    parameters: {
        categoryId?: string
        q?: string
        filters?: Record<string, string[]>
        sort?: string
        limit?: number
        page?: number
        expand?: string[]
        refine?: string[]
        // select?: string
        // currency?: string
        // allImages?: boolean
        // allVariationProperties?: boolean
        // perPricebook?: boolean
    }
): Promise<ShopperSearchTypes.ProductSearchResult> => {
    const {
        categoryId,
        q = '',
        filters,
        sort = '',
        limit = 24,
        page = 0,
        expand = ['custom_properties', 'images', 'prices', 'promotions', 'variations'],
        refine = []
    } = parameters || {}

    // Build refinements for product search
    const refineSet = new Set<string>(refine)
    categoryId && refineSet.add(`cgid=${categoryId}`)
    if (filters) {
        Object.entries(filters).forEach(([key, values]) => {
            values.forEach((value) => {
                refineSet.add(`${key}=${value}`)
            })
        })
    }

    const client = createShopperSearchClient(session)
    return client.productSearch({
        parameters: {
            q,
            sort,
            limit,
            expand,
            refine: [...refineSet],
            offset: page * limit
        }
    }) as unknown as Promise<ShopperSearchTypes.ProductSearchResult>
}
