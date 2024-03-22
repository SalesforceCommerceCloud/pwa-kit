/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

interface Props {
    value: number
}

const ProductList = ({value}: Props) => {
    return (
        <div>
            <h1>Product List Page</h1>
        </div>
    )
}

ProductList.getTemplateName = () => 'product-list'

export default ProductList
