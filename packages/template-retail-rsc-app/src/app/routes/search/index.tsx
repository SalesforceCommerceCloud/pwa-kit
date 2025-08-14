import {type LoaderFunctionArgs} from 'react-router'
import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import {getCommerceApiToken} from '@/app/utils/api/commerce-api'
import {fetchSearchProducts} from '@/app/utils/api/commerce-client.server'
import ProductGrid from '@/app/components/productGrid'
import CategoryRefinements from '@/app/components/categoryRefinements'
import CategorySorting from '@/app/components/categorySorting'
import CategoryPagination from '@/app/components/categoryPagination'
import SearchResultsSummary from '@/app/components/searchResultsSummary'

const limit = 24

export async function loader({request}: LoaderFunctionArgs): Promise<{
    searchTerm: string
    searchResult: ShopperSearchTypes.ProductSearchResult
}> {
    const {searchParams} = new URL(request.url)
    const [session] = await getCommerceApiToken(request)
    const page = parseInt(searchParams.get('page') || '1', 10) - 1
    const q = searchParams.get('q') ?? ''
    const sort = searchParams.get('sort') ?? ''
    const refine = searchParams.getAll('refine')
    const searchResult = await fetchSearchProducts(session.data, {q, limit, page, sort, refine})
    return {searchTerm: q, searchResult}
}

export default function Search({
    loaderData: {searchTerm, searchResult}
}: {
    loaderData: {
        searchTerm: string
        searchResult: ShopperSearchTypes.ProductSearchResult
    }
}) {
    const hasResults = searchResult.hits && searchResult.hits.length > 0
    const totalResults = searchResult.total || 0

    return (
        <div className="pb-16">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Search Header */}
                <div className="mb-8">
                    {searchTerm && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <p className="text-gray-600">Search Results for</p>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    "{searchTerm}" ({totalResults.toLocaleString()} {totalResults === 1 ? 'result' : 'results'})
                                </h1>
                            </div>

                            {hasResults && (
                                <div className="flex-shrink-0">
                                    <CategorySorting result={searchResult} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Search Results */}
                {searchTerm ? (
                    hasResults ? (
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Filters Sidebar */}
                            <div className="hidden lg:block w-64 flex-shrink-0">
                                <CategoryRefinements result={searchResult} />
                            </div>

                            {/* Results Grid */}
                            <div className="flex-grow">
                                <SearchResultsSummary 
                                    searchTerm={searchTerm} 
                                    result={searchResult} 
                                    className="mb-6" 
                                />
                                <ProductGrid products={searchResult.hits ?? []} />

                                {/* Pagination */}
                                {totalResults > limit && (
                                    <div className="mt-10">
                                        <CategoryPagination limit={limit} result={searchResult} />
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="max-w-md mx-auto">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-2">No results found</h2>
                                <p className="text-gray-600 mb-6">
                                    We couldn't find any products matching "{searchTerm}". Try adjusting your search terms or browse our categories.
                                </p>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-500">Try searching for:</p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {['shoes', 'electronics', 'clothing', 'accessories'].map((term) => (
                                            <a
                                                key={term}
                                                href={`/search?q=${encodeURIComponent(term)}`}
                                                className="inline-block px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                                            >
                                                {term}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="text-center py-16">
                        <div className="max-w-md mx-auto">
                            <div className="text-gray-400 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Search for products</h2>
                            <p className="text-gray-600 mb-6">
                                Use the search bar in the header to find products, brands, or categories.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
