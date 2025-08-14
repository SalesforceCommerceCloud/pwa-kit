import type {ReactElement} from 'react'
import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import ProductCard from '@/app/components/productCard'

export default function ProductGrid({
    products,
    isLoading = false
}: {
    products: ShopperSearchTypes.ProductSearchHit[]
    isLoading?: boolean
}): ReactElement {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-8">
                {Array.from({length: 8}).map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-8">
                {products.map((product) => (
                    <ProductCard key={product.productId} product={product} />
                ))}
            </div>

            {/* Show a message when no products are found */}
            {products.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <p className="text-lg text-gray-500">No products found.</p>
                    <p className="text-sm text-gray-400 mt-2">Try adjusting your search criteria or browse our categories.</p>
                </div>
            )}
        </>
    )
}
