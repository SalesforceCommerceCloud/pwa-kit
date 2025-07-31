import type {ReactElement} from 'react'
import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'
import ProductCard from '@/app/components/productCard'

export default function ProductCarouselContent({
    products
}: {
    products: ShopperSearchTypes.ProductSearchHit[]
}): ReactElement {
    return (
        <>
            {products.map((product) => (
                <div
                    key={product.productId}
                    className="flex-none w-60 md:w-72 snap-start"
                    data-sfdc-origin="server"
                >
                    <ProductCard product={product} />
                </div>
            ))}
        </>
    )
}
