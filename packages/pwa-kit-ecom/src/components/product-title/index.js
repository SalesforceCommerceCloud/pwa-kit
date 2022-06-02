/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Box, Skeleton, Heading} from '@chakra-ui/react'

const ProductTitle = (props) => {
    const {product} = props
    return (
        <Box>
            {
                <Skeleton isLoaded={product?.name}>
                    <Heading fontSize="2xl">{`${product?.name}`}</Heading>
                </Skeleton>
            }
        </Box>
    )
}

ProductTitle.propTypes = {}

export default ProductTitle
