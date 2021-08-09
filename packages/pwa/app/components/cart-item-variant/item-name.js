import React from 'react'
import {Text} from '@chakra-ui/react'
import {useCartItemVariant} from '.'

/**
 * In the context of a cart product item variant, this components simply renders
 * the item's name using the cart item field `productName`. We use this field
 * rather than variant `name` field as the variant detail may not yet be
 * available upon rendering.
 */
const ItemName = (props) => {
    const variant = useCartItemVariant()

    return (
        <Text fontWeight="bold" {...props}>
            {variant.productName}
        </Text>
    )
}

export default ItemName
