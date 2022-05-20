import React from 'react'
import {ProductContext} from '../components/product-provider/context'

export const useProduct = () => {
    const context = React.useContext(ProductContext)
    console.log('context', context)
    if (context === undefined) {
        throw new Error('useProduct must be used within a ProductProvider')
    }
    return context
}
