/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useItemVariant} from '.'
import Link from '@salesforce/retail-react-app/app/components/link'
import {Box, Stack, Badge} from '@chakra-ui/react'

/**
 * In the context of a cart product item variant, this components simply renders
 * the item's name using the cart item field `productName`. We use this field
 * rather than variant `name` field as the variant detail may not yet be
 * available upon rendering.
 */
const ItemName = (props) => {
    const variant = useItemVariant()
    const productId = variant?.master?.masterId || variant.id

    return variant?.isProductUnavailable ? (
        <Stack
            direction={['column', 'column', 'row']}
            alignItems={['flex-start', 'flex-start', 'center']}
            spacing={[0, 0, 2]}
        >
            <Box fontWeight="bold" {...props} color="black.600">
                {variant.productName || variant.name}
            </Box>
            {variant?.isProductUnavailable ? (
                <Badge colorScheme="red">Product Unavailable</Badge>
            ) : null}
        </Stack>
    ) : (
        <Link fontWeight="bold" {...props} color="black.600" to={`/product/${productId}`}>
            {variant.productName || variant.name}
        </Link>
    )
}

export default ItemName
