import 'client-only'
import {useContext} from 'react'
import {type QueryClient, useQuery, type UseQueryResult} from '@tanstack/react-query'
import type {ShopperProductsTypes} from 'commerce-sdk-isomorphic'
import {CommerceClientContext} from '@/app/providers/commerce.client'
import {createQueryClient} from '@/app/utils/api/commerce-client'
import {createProductsGetCategoryQuery} from '@/app/utils/api/commerce-client-queries'

let queryClient: QueryClient | undefined

export const getQueryClient = () => {
    if (!queryClient) {
        queryClient = createQueryClient()
    }
    return queryClient
}

export const useProductsGetCategory = (
    parameters: {
        id: string | null
        levels?: number
    },
    queryParameters: Partial<Parameters<typeof useQuery<ShopperProductsTypes.Category>>[0]> = {}
): UseQueryResult<ShopperProductsTypes.Category> => {
    const {session} = useContext(CommerceClientContext)
    return useQuery({
        ...createProductsGetCategoryQuery(session, parameters),
        ...queryParameters
    })
}

// export const useSearchProducts = (
//     parameters: {
//         categoryId?: string
//         q?: string
//         filters?: Record<string, string[]>
//         sort?: string
//         limit?: number
//         page?: number
//         expand?: string[]
//         // select?: string
//         // refine?: string[]
//         // currency?: string
//         // allImages?: boolean
//         // allVariationProperties?: boolean
//         // perPricebook?: boolean
//     },
//     queryParams: Partial<
//         Parameters<typeof useQuery<ShopperSearchTypes.ProductSearchResult>>[0]
//     > = {}
// ): UseQueryResult<ShopperSearchTypes.ProductSearchResult> => {
//     const {session} = useContext(CommerceClientContext)
//     return useQuery({
//         ...createSearchProductsQuery(session, parameters),
//         ...queryParams
//     })
// }
