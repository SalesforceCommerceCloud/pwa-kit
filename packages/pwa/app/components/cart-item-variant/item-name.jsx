/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import {useCartItemVariant} from '.'
import Link from '../link'

/**
 * In the context of a cart product item variant, this components simply renders
 * the item's name using the cart item field `productName`. We use this field
 * rather than variant `name` field as the variant detail may not yet be
 * available upon rendering.
 */
const ItemName = (props) => {
    const variant = useCartItemVariant()

    return (
        <Link
            fontWeight="bold"
            {...props}
            color="black.600"
            to={`/product/${variant?.master?.masterId}`}
        >
            {variant.productName}
        </Link>
    )
}

export default ItemName
