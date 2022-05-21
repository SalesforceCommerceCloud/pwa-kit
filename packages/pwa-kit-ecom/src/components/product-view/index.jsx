import React from 'react'
import ImageGallery from '../image-gallary'
import ProductTitle from '../product-title'
import {Flex, Box, VStack} from '@chakra-ui/react'

function ProductView(props) {
    console.log('ProductView props', props )
    const {imageGallery, productTitle, product} = props
    // const {product, variationParams} = useProduct(props.product)

    return (
        <Flex direction={'column'} data-testid="product-view">
            {/* Basic information etc. title, price, breadcrumb*/}
            <Box display={['block', 'block', 'block', 'none']}>
                {productTitle ? productTitle : <ProductTitle product={product} />}
            </Box>
            <Flex direction={['column', 'column', 'column', 'row']}>
                <Box flex={1} mr={[0, 0, 0, 6, 6]}>
                    {product ? (
                        <>
                            {imageGallery ? (
                                imageGallery
                            ) : (
                                <ImageGallery
                                    size={'md'}
                                    imageGroups={product.imageGroups}
                                    // selectedVariationAttributes={variationParams}
                                />
                            )}
                        </>
                    ) : (
                        <div>LOADING...</div>
                    )}
                </Box>

                {/* Variations & Quantity Selector */}
                <VStack align="stretch" spacing={8} flex={1} marginBottom={[16, 16, 16, 0, 0]}>
                    <Box display={['none', 'none', 'none', 'block']}>
                        {productTitle ? productTitle : <ProductTitle product={product} />}
                    </Box>
                </VStack>
            </Flex>
        </Flex>
    )
}

export default ProductView
