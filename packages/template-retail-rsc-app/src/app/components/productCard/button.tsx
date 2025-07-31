'use client'

import type {ReactElement} from 'react'
import {useNavigate} from 'react-router'
import type {ShopperSearchTypes} from 'commerce-sdk-isomorphic'

export default function ProductCardButton({
    product
}: {
    product: ShopperSearchTypes.ProductSearchHit
}): ReactElement {
    const navigate = useNavigate()

    return (
        <button
            onClick={() => navigate(`/product/${product.productId}`)}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 py-2 rounded-md font-medium shadow-md transition-colors cursor-pointer"
            data-sfdc-origin="client"
        >
            Select Variant
        </button>
    )
}
