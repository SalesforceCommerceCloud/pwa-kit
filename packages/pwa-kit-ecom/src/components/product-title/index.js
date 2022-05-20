import React from 'react'
import PropTypes from 'prop-types'
import {Box, Skeleton, Heading} from '@chakra-ui/react'
// import {useProduct} from '../product-provider'

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
