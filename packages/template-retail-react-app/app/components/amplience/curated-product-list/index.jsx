import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {useCommerceAPI} from '../../../commerce-api/contexts'
import {handleAsyncError} from '../../../commerce-api/utils'
import ProductScroller from '../product-scroller'
import {Stack} from '@chakra-ui/react'

const selectImage = (product) => {
    const groups = product.imageGroups
    if (groups == null || groups.length === 0) {
        return {}
    }

    const desiredViewType = 'large'
    const desiredGroup = groups.find((group) => group.viewType === desiredViewType) ?? groups[0]

    return desiredGroup.images[0]
}

const CuratedProductList = ({title, products}) => {
    const api = useCommerceAPI()
    const [apiProducts, setApiProducts] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let active = true

        if (products?.length === 0) {
            // No products likely means that the IDs haven't arrived yet.
            setApiProducts([])
            setIsLoading(true)
            return
        }

        handleAsyncError(async () => {
            const response = await api.shopperProducts.getProducts({
                parameters: {ids: products.join(',')}
            })

            if (active) {
                const products = response.data.map((product) => ({
                    ...product,
                    productId: product.id,
                    image: selectImage(product)
                }))

                setApiProducts(products)
                setIsLoading(false)
            }
        })()

        return () => (active = false)
    }, [api, products])

    return (
        <Stack pt={8} spacing={16}>
            <ProductScroller title={title} products={apiProducts} isLoading={isLoading} />
        </Stack>
    )
}

CuratedProductList.displayName = 'Curated Product List'

CuratedProductList.propTypes = {
    title: PropTypes.string,
    products: PropTypes.array
}

export default CuratedProductList
