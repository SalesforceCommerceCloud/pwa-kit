import 'client-only'
import {useContext, useState, useCallback} from 'react'
import type {ShopperProductsTypes, ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import {CommerceClientContext} from '@/app/providers/commerce.client'
import {
    createShopperProductsClient,
    createShopperSearchClient
} from '@/app/utils/api/commerce-client'

/**
 * Client-side hook for fetching product search data on-demand using commerce-sdk-isomorphic directly.
 * This hook provides a simple interface for fetching product search results when needed.
 */
export const useClientSideProductSearch = () => {
    const {session} = useContext(CommerceClientContext)
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState<ShopperSearchTypes.ProductSearchHit[]>([])
    const [error, setError] = useState<string | null>(null)

    const fetchProducts = useCallback(
        async (
            parameters: {
                categoryId?: string
                q?: string
                limit?: number
                expand?: string[]
            } = {}
        ): Promise<ShopperSearchTypes.ProductSearchHit[]> => {
            if (!session) {
                console.error('No session available for product search')
                setError('No session available')
                return []
            }

            try {
                setLoading(true)
                setError(null)

                const {categoryId, q = '', limit = 8, expand = ['images', 'prices']} = parameters

                // Build refinements for product search
                const refine: string[] = []
                if (categoryId) {
                    refine.push(`cgid=${categoryId}`)
                }

                const client = createShopperSearchClient(session)
                const searchResult = await client.productSearch({
                    parameters: {
                        q,
                        limit,
                        expand,
                        refine,
                        offset: 0
                    }
                })

                const productHits = searchResult.hits || []
                setProducts(productHits)
                return productHits
            } catch (err) {
                console.error('Failed to fetch products:', err)
                const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products'
                setError(errorMessage)
                return []
            } finally {
                setLoading(false)
            }
        },
        [session]
    )

    return {
        fetchProducts,
        products,
        loading,
        error
    }
}

/**
 * Client-side hook for fetching category data on-demand using commerce-sdk-isomorphic directly.
 * This hook provides a simple interface for fetching deeper category levels when needed.
 */
export const useClientSideCategory = () => {
    const {session} = useContext(CommerceClientContext)
    const [loadingCategories, setLoadingCategories] = useState<Set<string>>(new Set())
    const [categoryCache, setCategoryCache] = useState<Map<string, ShopperProductsTypes.Category>>(
        new Map()
    )

    const fetchCategory = useCallback(
        async (
            categoryId: string,
            levels: number = 2
        ): Promise<ShopperProductsTypes.Category | null> => {
            if (!session) {
                console.error('No session available for category fetch')
                return null
            }

            // Create cache key that includes levels for more granular caching
            const cacheKey = `${categoryId}-levels-${levels}`

            // Return cached data if available
            if (categoryCache.has(cacheKey)) {
                return categoryCache.get(cacheKey)!
            }

            // Prevent duplicate requests for the same category
            if (loadingCategories.has(cacheKey)) {
                return null
            }

            try {
                setLoadingCategories((prev) => new Set(prev).add(cacheKey))

                const client = createShopperProductsClient(session)
                const categoryData = await client.getCategory({
                    parameters: {
                        id: categoryId,
                        levels
                    }
                })

                // Cache the result
                setCategoryCache((prev) => new Map(prev).set(cacheKey, categoryData))

                return categoryData
            } catch (error) {
                console.error(`Failed to fetch category ${categoryId}:`, error)
                return null
            } finally {
                setLoadingCategories((prev) => {
                    const newSet = new Set(prev)
                    newSet.delete(cacheKey)
                    return newSet
                })
            }
        },
        [session, categoryCache, loadingCategories]
    )

    const isCategoryLoading = useCallback(
        (categoryId: string, levels: number = 2): boolean => {
            const cacheKey = `${categoryId}-levels-${levels}`
            return loadingCategories.has(cacheKey)
        },
        [loadingCategories]
    )

    const getCachedCategory = useCallback(
        (categoryId: string, levels: number = 2): ShopperProductsTypes.Category | null => {
            const cacheKey = `${categoryId}-levels-${levels}`
            return categoryCache.get(cacheKey) || null
        },
        [categoryCache]
    )

    return {
        fetchCategory,
        isCategoryLoading,
        getCachedCategory
    }
}
