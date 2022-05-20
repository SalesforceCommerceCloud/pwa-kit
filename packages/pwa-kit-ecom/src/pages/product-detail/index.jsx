import React from 'react'
import {ProductProvider} from '../../components/product-provider'

function ProductDetail(props) {
    console.log('props in PRODUCT DETAIL ===============', props)
    return <ProductProvider product={props.product}>{props.children}</ProductProvider>
}

export default ProductDetail
