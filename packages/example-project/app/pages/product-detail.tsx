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

const ProductDetail = ({value}: Props) => {
    return (
        <div>
            <h1>Product Detail Project Override</h1>
            <p>If you are seeing this it means that customer projects are able to override files defined in extensions.</p>
        </div>
    )
}

ProductDetail.getTemplateName = () => 'product-detail'

export default ProductDetail
