import React from 'react'
import ImageGallery from '../image-gallary'
import ProductTitle from '../product-title'
import {Flex, Box, VStack, useStyleConfig, Button} from '@chakra-ui/react'
import {useTheme} from '@chakra-ui/react'
import {useProduct} from '../../hooks/use-product'

function ProductView(props) {
    console.log('ProductView props', props)
    const {imageGallery, productTitle} = props
    const {product, variationParams} = useProduct(props.product)
    const styles = useStyleConfig('ProductView')
    // console.log('styles', styles)
    // console.log('useTheme()', useTheme())
    return (
        <Flex data-testid="product-view" __css={styles}>
            {/* Basic information etc. title, price, breadcrumb*/}
            <Box display={['block', 'block', 'block', 'none']} {...styles}>
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
                                    selectedVariationAttributes={variationParams}
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
