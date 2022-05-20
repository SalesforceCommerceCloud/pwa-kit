import React from 'react'
import {ProductContext} from './context'

export const ProductProvider = ({children, product: initialProduct}) => {
    const [product, setProduct] = React.useState(initialProduct)
    console.log('initialProduct', initialProduct)
    console.log('product ProductProvider', product)
    return (
        <ProductContext.Provider value={{product, setProduct}}>{children}</ProductContext.Provider>
    )
}
