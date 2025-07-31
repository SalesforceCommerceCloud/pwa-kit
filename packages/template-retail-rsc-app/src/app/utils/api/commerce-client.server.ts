import 'server-only'

import type {ShopperProductsTypes, ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import type {SessionData} from '@/app/utils/api/commerce-api'
import {createQueryClient} from '@/app/utils/api/commerce-client'
import {
    createProductsGetCategoryQuery,
    createSearchProductsQuery
} from '@/app/utils/api/commerce-client-queries'

export const getQueryClient = () => createQueryClient()

// export async function dehydrateQuery(query: FetchQueryOptions<any>): Promise<DehydratedState> {
//     const queryClient = getQueryClient()
//     await queryClient.prefetchQuery(query)
//     return dehydrate(queryClient)
// }

export const fetchProductsGetCategory = (
    session: SessionData,
    parameters: {
        id: string | null
        levels?: number
    }
): Promise<ShopperProductsTypes.Category> =>
    getQueryClient().fetchQuery(createProductsGetCategoryQuery(session, parameters))

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
): Promise<ShopperSearchTypes.ProductSearchResult> =>
    getQueryClient().fetchQuery(createSearchProductsQuery(session, parameters))
